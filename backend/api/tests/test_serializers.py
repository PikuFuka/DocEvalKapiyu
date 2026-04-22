# api/tests/test_serializers.py

from datetime import date
from django.test import TestCase
from rest_framework.test import APIRequestFactory
from api.models import User, FacultyProfile, DocumentUpload
from api.serializers import (
    FacultyRegistrationSerializer,
    DocumentUploadSerializer,
    DocumentUploadListSerializer,
    AdminUserSerializer,
    UserSerializer,
    EmailVerificationSerializer,
    FacultyProfileSerializer,
)


class FacultyRegistrationSerializerTest(TestCase):
    """Tests for FacultyRegistrationSerializer."""

    def test_valid_data(self):
        """Valid data passes validation."""
        data = {
            'email': 'new@test.edu',
            'password': 'Str0ng!Pass123',
            'first_name': 'Juan',
            'last_name': 'Cruz',
        }
        serializer = FacultyRegistrationSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_missing_email(self):
        """Missing email fails validation."""
        data = {'password': 'Str0ng!Pass', 'first_name': 'J', 'last_name': 'C'}
        serializer = FacultyRegistrationSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)

    def test_missing_password(self):
        """Missing password fails validation."""
        data = {'email': 'x@x.edu', 'first_name': 'J', 'last_name': 'C'}
        serializer = FacultyRegistrationSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('password', serializer.errors)

    def test_missing_first_name(self):
        """Missing first_name fails validation."""
        data = {'email': 'x@x.edu', 'password': 'pass', 'last_name': 'C'}
        serializer = FacultyRegistrationSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('first_name', serializer.errors)

    def test_create_user(self):
        """create() method produces a User with hashed password."""
        data = {
            'email': 'created@test.edu',
            'password': 'Str0ng!Pass',
            'first_name': 'Test',
            'last_name': 'User',
        }
        serializer = FacultyRegistrationSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        self.assertEqual(user.email, 'created@test.edu')
        self.assertTrue(user.check_password('Str0ng!Pass'))
        self.assertFalse(user.is_staff)

    def test_password_write_only(self):
        """Password is not returned in serialized output."""
        data = {
            'email': 'wo@test.edu',
            'password': 'Str0ng!Pass',
            'first_name': 'W',
            'last_name': 'O',
        }
        serializer = FacultyRegistrationSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.assertNotIn('password', serializer.data)


class DocumentUploadSerializerTest(TestCase):
    """Tests for DocumentUploadSerializer and DocumentUploadListSerializer."""

    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            username='ser@test.edu', email='ser@test.edu', password='pass'
        )

    def _make_upload(self, **overrides):
        defaults = {
            'user': self.user,
            'google_drive_link': 'https://drive.google.com/file/d/test/view',
            'status': 'pending',
        }
        defaults.update(overrides)
        return DocumentUpload.objects.create(**defaults)

    def test_expected_fields_present(self):
        """All expected fields appear in serialized output."""
        upload = self._make_upload()
        data = DocumentUploadSerializer(upload).data
        expected_fields = {
            'id', 'google_drive_link', 'status', 'created_at', 'google_sheet_link',
            'equivalent_percentage', 'total_score', 'primary_kra', 'kra_confidence',
            'criteria', 'sub_criteria', 'explanation', 'error_message',
            'page_count', 'extracted_text_preview', 'source_filename',
            'classification_time', 'total_processing_time',
            'extracted_json', 'success',
        }
        self.assertEqual(set(data.keys()), expected_fields)

    def test_success_true_when_completed(self):
        """success=True for completed upload with results."""
        upload = self._make_upload(
            status='completed', primary_kra='KRA I', total_score=85.0
        )
        data = DocumentUploadSerializer(upload).data
        self.assertTrue(data['success'])

    def test_success_false_when_pending(self):
        """success=False for pending upload."""
        upload = self._make_upload(status='pending')
        data = DocumentUploadSerializer(upload).data
        self.assertFalse(data['success'])

    def test_success_false_when_failed(self):
        """success=False for failed upload even with partial data."""
        upload = self._make_upload(status='failed', primary_kra='KRA I')
        data = DocumentUploadSerializer(upload).data
        self.assertFalse(data['success'])

    def test_list_serializer_excludes_extracted_json(self):
        """DocumentUploadListSerializer omits extracted_json field."""
        upload = self._make_upload()
        data = DocumentUploadListSerializer(upload).data
        self.assertNotIn('extracted_json', data)
        # But the full serializer includes it
        full_data = DocumentUploadSerializer(upload).data
        self.assertIn('extracted_json', full_data)


class AdminUserSerializerTest(TestCase):
    """Tests for AdminUserSerializer."""

    def test_total_uploads_annotated(self):
        """Uses annotated total_uploads when available."""
        user = User.objects.create_user(
            username='admin_s@test.edu', email='admin_s@test.edu', password='pass'
        )
        # Simulate annotation
        user.total_uploads = 42
        data = AdminUserSerializer(user).data
        self.assertEqual(data['total_uploads'], 42)

    def test_total_uploads_fallback(self):
        """Falls back to .count() when annotation missing."""
        user = User.objects.create_user(
            username='admin_f@test.edu', email='admin_f@test.edu', password='pass'
        )
        data = AdminUserSerializer(user).data
        self.assertEqual(data['total_uploads'], 0)


class UserSerializerTest(TestCase):
    """Tests for UserSerializer."""

    def test_includes_expected_fields(self):
        """UserSerializer includes faculty_profile and auth fields."""
        user = User.objects.create_user(
            username='us@test.edu', email='us@test.edu', password='pass',
            first_name='Test', last_name='User',
        )
        data = UserSerializer(user).data
        expected = {'id', 'username', 'email', 'first_name', 'last_name',
                    'faculty_profile', 'is_staff', 'email_verified'}
        self.assertEqual(set(data.keys()), expected)


class EmailVerificationSerializerTest(TestCase):
    """Tests for EmailVerificationSerializer."""

    def test_valid_token(self):
        """Token field accepts a string."""
        serializer = EmailVerificationSerializer(data={'token': 'abc123'})
        self.assertTrue(serializer.is_valid())

    def test_missing_token(self):
        """Missing token fails validation."""
        serializer = EmailVerificationSerializer(data={})
        self.assertFalse(serializer.is_valid())
        self.assertIn('token', serializer.errors)
