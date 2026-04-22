# api/tests/test_upload_views.py

from unittest.mock import patch, MagicMock

from django.test import TestCase, override_settings
from rest_framework.test import APIClient
from rest_framework import status

from api.models import User, DocumentUpload


TEST_DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}


def _mock_process_noop(upload, classification_only=True, **kwargs):
    """Stub that marks the upload as for_review without real processing."""
    upload.status = 'for_review'
    upload.primary_kra = 'KRA I'
    upload.criteria = 'A'
    upload.sub_criteria = 'Teaching Effectiveness'
    upload.save()
    return True


def _mock_process_confirm(upload, classification_only=False, **kwargs):
    """Stub for the confirmation processing step."""
    upload.status = 'completed'
    upload.total_score = 85.0
    upload.save()
    return True


@override_settings(DATABASES=TEST_DATABASES)
class DocumentUploadViewTest(TestCase):
    """Tests for the document upload creation endpoint."""

    def setUp(self):
        self.client = APIClient()
        self.url = '/api/uploads/'
        self.user = User.objects.create_user(
            username='upload@test.edu', email='upload@test.edu', password='pass',
        )
        self.client.force_authenticate(user=self.user)

    @patch('api.views.upload_views._document_processing_service')
    def test_create_single_upload(self, mock_svc):
        """Single link upload returns 201."""
        mock_module = MagicMock()
        mock_module.process_document_upload = _mock_process_noop
        mock_svc.return_value = mock_module

        response = self.client.post(self.url, {
            'google_drive_link': 'https://drive.google.com/file/d/single/view'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(DocumentUpload.objects.count(), 1)

    @patch('api.views.upload_views._document_processing_service')
    def test_create_batch_upload(self, mock_svc):
        """Batch upload with 3 links returns 201 with array."""
        mock_module = MagicMock()
        mock_module.process_document_upload = _mock_process_noop
        mock_svc.return_value = mock_module

        links = [
            'https://drive.google.com/file/d/a/view',
            'https://drive.google.com/file/d/b/view',
            'https://drive.google.com/file/d/c/view',
        ]
        response = self.client.post(self.url, {
            'google_drive_links': links
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(response.data), 3)

    def test_batch_exceeds_max_links(self):
        """More than 5 links returns 400."""
        links = [f'https://drive.google.com/file/d/{i}/view' for i in range(6)]
        response = self.client.post(self.url, {
            'google_drive_links': links
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Maximum', response.data['error'])

    @patch('api.views.upload_views._document_processing_service')
    def test_duplicate_link_rejected(self, mock_svc):
        """Re-submitting the same link returns 400."""
        mock_module = MagicMock()
        mock_module.process_document_upload = _mock_process_noop
        mock_svc.return_value = mock_module

        link = 'https://drive.google.com/file/d/dup/view'
        self.client.post(self.url, {'google_drive_link': link}, format='json')
        # Complete the first upload so the for_review guard doesn't fire
        DocumentUpload.objects.filter(user=self.user).update(status='completed')
        response = self.client.post(self.url, {'google_drive_link': link}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Duplicate', response.data['error'])

    @patch('api.views.upload_views._document_processing_service')
    def test_pending_review_blocks_new(self, mock_svc):
        """Existing 'for_review' uploads block new submissions."""
        mock_module = MagicMock()
        mock_module.process_document_upload = _mock_process_noop
        mock_svc.return_value = mock_module

        # Create a document stuck in for_review
        DocumentUpload.objects.create(
            user=self.user,
            google_drive_link='https://drive.google.com/file/d/old/view',
            status='for_review',
        )
        response = self.client.post(self.url, {
            'google_drive_link': 'https://drive.google.com/file/d/new/view'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('pending_review_count', response.data)

    def test_no_link_provided(self):
        """Empty body returns 400."""
        response = self.client.post(self.url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_unauthenticated_returns_401(self):
        """Unauthenticated request returns 401."""
        self.client.logout()
        self.client.force_authenticate(user=None)
        response = self.client.post(self.url, {
            'google_drive_link': 'https://drive.google.com/file/d/x/view'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


@override_settings(DATABASES=TEST_DATABASES)
class PeekDriveLinkViewTest(TestCase):
    """Tests for the peek drive link endpoint."""

    def setUp(self):
        self.client = APIClient()
        self.url = '/api/uploads/peek/'
        self.user = User.objects.create_user(
            username='peek@test.edu', email='peek@test.edu', password='pass',
        )
        self.client.force_authenticate(user=self.user)

    @patch('api.views.upload_views._document_processing_service')
    def test_peek_success(self, mock_svc):
        """Valid link returns file metadata."""
        mock_module = MagicMock()
        mock_module.get_drive_file_name.return_value = {'name': 'test.pdf', 'mimeType': 'application/pdf'}
        mock_svc.return_value = mock_module

        response = self.client.post(self.url, {
            'link': 'https://drive.google.com/file/d/abc/view'
        }, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['name'], 'test.pdf')

    def test_peek_no_link(self):
        """Missing link returns 400."""
        response = self.client.post(self.url, {}, format='json')
        self.assertEqual(response.status_code, 400)


@override_settings(DATABASES=TEST_DATABASES)
class UserUploadsListViewTest(TestCase):
    """Tests for the user uploads list endpoint."""

    def setUp(self):
        self.client = APIClient()
        self.url = '/api/user/uploads/'
        self.user = User.objects.create_user(
            username='list@test.edu', email='list@test.edu', password='pass',
        )
        self.client.force_authenticate(user=self.user)

    def test_returns_user_uploads(self):
        """Returns only the current user's uploads."""
        DocumentUpload.objects.create(
            user=self.user,
            google_drive_link='https://drive.google.com/file/d/mine/view',
        )
        other = User.objects.create_user(
            username='other@test.edu', email='other@test.edu', password='pass',
        )
        DocumentUpload.objects.create(
            user=other,
            google_drive_link='https://drive.google.com/file/d/notmine/view',
        )
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)


@override_settings(DATABASES=TEST_DATABASES)
class ConfirmUploadViewTest(TestCase):
    """Tests for the confirm upload classification endpoint."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='confirm@test.edu', email='confirm@test.edu', password='pass',
        )
        self.client.force_authenticate(user=self.user)

    def _make_upload(self, **kwargs):
        defaults = {
            'user': self.user,
            'google_drive_link': 'https://drive.google.com/file/d/conf/view',
            'status': 'for_review',
            'primary_kra': 'KRA I',
            'criteria': 'A',
            'sub_criteria': 'Teaching Effectiveness',
        }
        defaults.update(kwargs)
        return DocumentUpload.objects.create(**defaults)

    def test_confirm_not_found(self):
        """Non-existent upload returns 404."""
        url = '/api/uploads/99999/confirm/'
        response = self.client.post(url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_confirm_failed_status(self):
        """Already-failed upload returns 400."""
        upload = self._make_upload(status='failed')
        url = f'/api/uploads/{upload.id}/confirm/'
        response = self.client.post(url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('failed', response.data['error'].lower())

    def test_confirm_already_completed(self):
        """Already-completed upload returns 200 with data."""
        upload = self._make_upload(status='completed', total_score=90.0)
        url = f'/api/uploads/{upload.id}/confirm/'
        response = self.client.post(url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_confirm_wrong_user(self):
        """Another user cannot confirm someone else's upload."""
        other = User.objects.create_user(
            username='hacker@test.edu', email='hacker@test.edu', password='pass',
        )
        upload = self._make_upload()
        self.client.force_authenticate(user=other)
        url = f'/api/uploads/{upload.id}/confirm/'
        response = self.client.post(url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
