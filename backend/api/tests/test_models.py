# api/tests/test_models.py

from datetime import date
from django.test import TestCase
from django.utils import timezone
from api.models import User, FacultyProfile, DocumentUpload, ClassificationFeedback


class UserModelTest(TestCase):
    """Tests for the custom User model."""

    def test_user_creation(self):
        """Creating a User stores all custom fields correctly."""
        user = User.objects.create_user(
            username='faculty@test.edu',
            email='faculty@test.edu',
            password='Str0ng!Pass',
            user_type='faculty',
            first_name='Juan',
            last_name='Dela Cruz',
        )
        self.assertEqual(user.email, 'faculty@test.edu')
        self.assertEqual(user.user_type, 'faculty')
        self.assertFalse(user.email_verified)
        self.assertEqual(user.first_name, 'Juan')

    def test_user_type_choices(self):
        """user_type field only allows 'faculty' or 'admin'."""
        expected = {'faculty', 'admin'}
        actual = {choice[0] for choice in User.USER_TYPE_CHOICES}
        self.assertEqual(actual, expected)

    def test_email_verified_default_false(self):
        """New users default to email_verified=False."""
        user = User.objects.create_user(
            username='new@test.edu', email='new@test.edu', password='pass1234'
        )
        self.assertFalse(user.email_verified)

    def test_verification_token_nullable(self):
        """verification_token is null by default."""
        user = User.objects.create_user(
            username='t@t.edu', email='t@t.edu', password='pass1234'
        )
        self.assertIsNone(user.verification_token)


class FacultyProfileModelTest(TestCase):
    """Tests for the FacultyProfile model."""

    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            username='profile@test.edu',
            email='profile@test.edu',
            password='Str0ng!Pass',
            user_type='faculty',
            first_name='Maria',
            last_name='Santos',
        )
        cls.profile = FacultyProfile.objects.create(
            user=cls.user,
            degree_name='BS Computer Science',
            hei_name='Test University',
            year_graduated=2020,
            faculty_rank='Instructor I',
            date_of_appointment=date(2021, 6, 1),
            suc_name='Test SUC',
            campus='Main Campus',
            address='123 Test St.',
        )

    def test_faculty_profile_creation(self):
        """FacultyProfile is created and linked to the correct user."""
        self.assertEqual(self.profile.user, self.user)
        self.assertEqual(self.profile.degree_name, 'BS Computer Science')
        self.assertEqual(self.profile.faculty_rank, 'Instructor I')

    def test_faculty_profile_str(self):
        """__str__ returns 'FirstName LastName - Rank'."""
        expected = 'Maria Santos - Instructor I'
        self.assertEqual(str(self.profile), expected)

    def test_faculty_rank_choices_complete(self):
        """All 20 faculty rank choices are defined."""
        self.assertEqual(len(FacultyProfile.FACULTY_RANK_CHOICES), 20)

    def test_mode_of_appointment_default(self):
        """mode_of_appointment defaults to 'NBC 461'."""
        self.assertEqual(self.profile.mode_of_appointment, 'NBC 461')

    def test_sheet_url_blank_by_default(self):
        """sheet_url can be blank/null."""
        self.assertIsNone(self.profile.sheet_url)


class DocumentUploadModelTest(TestCase):
    """Tests for the DocumentUpload model."""

    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            username='uploader@test.edu',
            email='uploader@test.edu',
            password='Str0ng!Pass',
        )
        cls.upload = DocumentUpload.objects.create(
            user=cls.user,
            google_drive_link='https://drive.google.com/file/d/abc123/view',
        )

    def test_document_upload_creation(self):
        """Upload is created with default status='pending'."""
        self.assertEqual(self.upload.status, 'pending')
        self.assertEqual(self.upload.user, self.user)

    def test_document_upload_status_choices(self):
        """All 5 status choices exist."""
        statuses = {c[0] for c in DocumentUpload.STATUS_CHOICES}
        expected = {'pending', 'processing', 'for_review', 'completed', 'failed'}
        self.assertEqual(statuses, expected)

    def test_document_upload_str(self):
        """__str__ returns 'Upload <id> by <username>'."""
        self.assertIn('Upload', str(self.upload))
        self.assertIn('uploader@test.edu', str(self.upload))

    def test_document_upload_ordering(self):
        """Meta ordering is ['-created_at']."""
        self.assertEqual(DocumentUpload._meta.ordering, ['-created_at'])

    def test_get_extracted_items_list(self):
        """get_extracted_items returns the list when extracted_json is a list."""
        self.upload.extracted_json = [{'key': 'value'}]
        self.upload.save()
        self.assertEqual(self.upload.get_extracted_items(), [{'key': 'value'}])

    def test_get_extracted_items_non_list(self):
        """get_extracted_items returns [] when extracted_json is not a list."""
        self.upload.extracted_json = 'not a list'
        self.assertEqual(self.upload.get_extracted_items(), [])

    def test_extracted_json_default_empty_list(self):
        """extracted_json defaults to an empty list."""
        new = DocumentUpload.objects.create(
            user=self.user,
            google_drive_link='https://drive.google.com/file/d/xyz/view',
        )
        self.assertEqual(new.extracted_json, [])


class ClassificationFeedbackModelTest(TestCase):
    """Tests for the ClassificationFeedback model."""

    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            username='fb@test.edu', email='fb@test.edu', password='pass1234'
        )
        cls.upload = DocumentUpload.objects.create(
            user=cls.user,
            google_drive_link='https://drive.google.com/file/d/fbk/view',
        )
        cls.feedback = ClassificationFeedback.objects.create(
            upload=cls.upload,
            user=cls.user,
            predicted_primary_kra='KRA I',
            predicted_criteria='A',
            predicted_sub_criteria='Teaching',
            corrected_primary_kra='KRA I',
            corrected_criteria='A',
            corrected_sub_criteria='Teaching',
            was_correct=True,
        )

    def test_classification_feedback_creation(self):
        """Feedback object is created correctly."""
        self.assertEqual(self.feedback.predicted_primary_kra, 'KRA I')
        self.assertTrue(self.feedback.was_correct)

    def test_str_correct(self):
        """__str__ shows 'correct' when was_correct=True."""
        self.assertIn('correct', str(self.feedback))

    def test_str_corrected(self):
        """__str__ shows 'corrected' when was_correct=False."""
        self.feedback.was_correct = False
        self.feedback.save()
        self.assertIn('corrected', str(self.feedback))
