# api/tests/test_admin_views.py

from django.test import TestCase, override_settings
from django.core.cache import cache
from rest_framework.test import APIClient
from rest_framework import status

from api.models import User, DocumentUpload, FacultyProfile
from datetime import date


TEST_DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}


@override_settings(DATABASES=TEST_DATABASES)
class AdminDashboardStatsViewTest(TestCase):
    """Tests for admin dashboard stats endpoint."""

    def setUp(self):
        self.client = APIClient()
        self.url = '/api/admin/stats/'
        self.admin = User.objects.create_user(
            username='admin@test.edu', email='admin@test.edu', password='admin',
            is_staff=True,
        )
        self.faculty = User.objects.create_user(
            username='fac@test.edu', email='fac@test.edu', password='pass',
            is_staff=False,
        )
        cache.clear()

    def test_admin_stats_success(self):
        """Admin gets correct total_faculty and total_documents counts."""
        DocumentUpload.objects.create(
            user=self.faculty,
            google_drive_link='https://drive.google.com/file/d/s1/view',
        )
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_faculty'], 1)
        self.assertEqual(response.data['total_documents'], 1)

    def test_admin_stats_non_admin(self):
        """Non-staff user gets 403."""
        self.client.force_authenticate(user=self.faculty)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_stats_caching(self):
        """Second call uses cached data."""
        self.client.force_authenticate(user=self.admin)
        self.client.get(self.url)
        # Add another doc — cache should still return old data
        DocumentUpload.objects.create(
            user=self.faculty,
            google_drive_link='https://drive.google.com/file/d/new/view',
        )
        response = self.client.get(self.url)
        # Cached data still returns 0 documents (from first call)
        self.assertEqual(response.data['total_documents'], 0)


@override_settings(DATABASES=TEST_DATABASES)
class AdminUsersListViewTest(TestCase):
    """Tests for admin users list endpoint."""

    def setUp(self):
        self.client = APIClient()
        self.url = '/api/admin/users/'
        self.admin = User.objects.create_user(
            username='admin2@test.edu', email='admin2@test.edu', password='admin',
            is_staff=True,
        )
        cache.clear()

    def test_admin_users_list(self):
        """Returns list of faculty users."""
        User.objects.create_user(
            username='f1@test.edu', email='f1@test.edu', password='pass', is_staff=False,
        )
        User.objects.create_user(
            username='f2@test.edu', email='f2@test.edu', password='pass', is_staff=False,
        )
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_admin_users_list_non_admin(self):
        """Non-staff user gets 403."""
        faculty = User.objects.create_user(
            username='nonadmin@test.edu', email='nonadmin@test.edu', password='pass',
        )
        self.client.force_authenticate(user=faculty)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


@override_settings(DATABASES=TEST_DATABASES)
class AdminUserDocumentsViewTest(TestCase):
    """Tests for admin user documents endpoint."""

    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username='admin3@test.edu', email='admin3@test.edu', password='admin',
            is_staff=True, first_name='Admin', last_name='User',
        )
        self.faculty = User.objects.create_user(
            username='fac3@test.edu', email='fac3@test.edu', password='pass',
            is_staff=False, first_name='Faculty', last_name='Member',
        )
        FacultyProfile.objects.create(
            user=self.faculty, degree_name='BS', hei_name='U',
            year_graduated=2020, faculty_rank='Instructor I',
            date_of_appointment=date(2021, 1, 1),
            suc_name='SUC', campus='C', address='A',
        )
        cache.clear()

    def test_admin_user_documents(self):
        """Returns documents for a specific faculty user."""
        DocumentUpload.objects.create(
            user=self.faculty,
            google_drive_link='https://drive.google.com/file/d/doc1/view',
        )
        self.client.force_authenticate(user=self.admin)
        url = f'/api/admin/user/{self.faculty.id}/documents/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user_id'], self.faculty.id)
        self.assertEqual(len(response.data['uploads']), 1)

    def test_admin_user_documents_not_found(self):
        """Invalid user_id returns 404."""
        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/admin/user/99999/documents/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_admin_user_documents_non_admin(self):
        """Non-staff user gets 403."""
        self.client.force_authenticate(user=self.faculty)
        url = f'/api/admin/user/{self.faculty.id}/documents/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
