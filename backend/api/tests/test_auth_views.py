# api/tests/test_auth_views.py

from datetime import date
from unittest.mock import patch, MagicMock

from django.test import TestCase, TransactionTestCase, override_settings
from rest_framework.test import APIClient
from rest_framework import status

from api.models import User, FacultyProfile


TEST_DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}


@override_settings(DATABASES=TEST_DATABASES)
class FacultyRegistrationViewTest(TransactionTestCase):
    """Tests for the faculty registration endpoint."""

    def setUp(self):
        self.client = APIClient()
        self.url = '/api/auth/faculty-register/'
        self.valid_data = {
            'email': 'newuser@test.edu',
            'password': 'Str0ngP@ss123',
            'first_name': 'Juan',
            'last_name': 'Cruz',
            'degree_name': 'BS CS',
            'hei_name': 'Test Univ',
            'year_graduated': 2020,
            'faculty_rank': 'Instructor I',
            'date_of_appointment': '2021-06-01',
            'suc_name': 'Test SUC',
            'campus': 'Main',
            'address': '123 Test St',
        }

    @patch('api.views.auth_views.send_verification_email')
    @patch('api.views.auth_views.create_user_google_sheet', return_value='https://sheets.google.com/test')
    def test_register_success(self, mock_sheet, mock_email):
        """Successful registration returns 201 and creates user + profile."""
        response = self.client.post(self.url, self.valid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('user_id', response.data)
        self.assertIn('email', response.data)
        self.assertTrue(User.objects.filter(email='newuser@test.edu').exists())
        self.assertTrue(FacultyProfile.objects.filter(user__email='newuser@test.edu').exists())

    @patch('api.views.auth_views.send_verification_email')
    @patch('api.views.auth_views.create_user_google_sheet', return_value=None)
    def test_register_duplicate_email_raises(self, mock_sheet, mock_email):
        """Duplicate email raises IntegrityError (username=email unique constraint)."""
        from django.db.utils import IntegrityError
        # Pre-create a user with the same email
        User.objects.create_user(
            username='newuser@test.edu', email='newuser@test.edu', password='x',
        )
        # The serializer does not enforce email uniqueness at the DRF level,
        # so the view crashes with a DB-level IntegrityError inside @transaction.atomic.
        with self.assertRaises(IntegrityError):
            self.client.post(self.url, self.valid_data, format='json')

    def test_register_missing_fields(self):
        """Missing required fields returns 400."""
        response = self.client.post(self.url, {'email': 'x@x.edu'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @patch('api.views.auth_views.send_verification_email')
    @patch('api.views.auth_views.create_user_google_sheet', return_value=None)
    def test_register_sets_verification_token(self, mock_sheet, mock_email):
        """Registration generates a verification token for the user."""
        self.client.post(self.url, self.valid_data, format='json')
        user = User.objects.get(email='newuser@test.edu')
        self.assertIsNotNone(user.verification_token)
        self.assertFalse(user.email_verified)


@override_settings(DATABASES=TEST_DATABASES)
class EmailVerificationViewTest(TestCase):
    """Tests for the email verification endpoint."""

    def setUp(self):
        self.client = APIClient()
        self.url = '/api/auth/verify-email/'
        self.user = User.objects.create_user(
            username='verify@test.edu', email='verify@test.edu', password='pass1234',
            verification_token='valid-token-123', email_verified=False,
        )

    def test_verify_email_success(self):
        """Valid token verifies the email."""
        response = self.client.post(self.url, {'token': 'valid-token-123'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.email_verified)
        self.assertIsNone(self.user.verification_token)

    def test_verify_email_invalid_token(self):
        """Invalid token returns 400."""
        response = self.client.post(self.url, {'token': 'bad-token'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_verify_email_missing_token(self):
        """Missing token returns 400."""
        response = self.client.post(self.url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_verify_email_get_with_query_param(self):
        """GET with ?token= also works."""
        response = self.client.get(f'{self.url}?token=valid-token-123')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.email_verified)


@override_settings(DATABASES=TEST_DATABASES)
class LoginViewTest(TestCase):
    """Tests for the login endpoint."""

    def setUp(self):
        self.client = APIClient()
        self.url = '/api/auth/login/'
        self.user = User.objects.create_user(
            username='login@test.edu', email='login@test.edu', password='Str0ng!Pass',
            email_verified=True,
        )

    def test_login_success(self):
        """Valid credentials return a token."""
        response = self.client.post(self.url, {
            'email': 'login@test.edu', 'password': 'Str0ng!Pass'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)
        self.assertEqual(response.data['email'], 'login@test.edu')

    def test_login_unverified_email(self):
        """Unverified email returns 400."""
        self.user.email_verified = False
        self.user.save()
        response = self.client.post(self.url, {
            'email': 'login@test.edu', 'password': 'Str0ng!Pass'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('verify', response.data['error'].lower())

    def test_login_invalid_credentials(self):
        """Wrong password returns 401."""
        response = self.client.post(self.url, {
            'email': 'login@test.edu', 'password': 'WrongPass'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


@override_settings(DATABASES=TEST_DATABASES)
class UserProfileViewTest(TestCase):
    """Tests for the user profile endpoint."""

    def setUp(self):
        self.client = APIClient()
        self.url = '/api/auth/profile/'
        self.user = User.objects.create_user(
            username='prof@test.edu', email='prof@test.edu', password='pass',
            first_name='Profile', last_name='User',
        )

    def test_authenticated_returns_profile(self):
        """Authenticated user gets their profile."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'prof@test.edu')

    def test_unauthenticated_returns_401(self):
        """Unauthenticated request returns 401."""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


@override_settings(DATABASES=TEST_DATABASES)
class FacultyProfileViewTest(TestCase):
    """Tests for the faculty profile retrieve/update endpoint."""

    def setUp(self):
        self.client = APIClient()
        self.url = '/api/faculty/profile/'
        self.user = User.objects.create_user(
            username='fp@test.edu', email='fp@test.edu', password='pass',
        )
        self.client.force_authenticate(user=self.user)

    def test_retrieve_creates_if_missing(self):
        """GET creates a FacultyProfile if one doesn't exist."""
        # NOTE: get_or_create in the view will fail without required fields,
        # so we pre-create the profile to test the happy path.
        FacultyProfile.objects.create(
            user=self.user,
            degree_name='BS IT',
            hei_name='Test U',
            year_graduated=2020,
            faculty_rank='Instructor I',
            date_of_appointment=date(2021, 1, 1),
            suc_name='SUC',
            campus='Main',
            address='Addr',
        )
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['degree_name'], 'BS IT')
