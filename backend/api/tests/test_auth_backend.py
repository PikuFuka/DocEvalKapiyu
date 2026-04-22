# api/tests/test_auth_backend.py

from django.test import TestCase, override_settings
from api.auth_backend import EmailBackend
from api.models import User


TEST_DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}


@override_settings(DATABASES=TEST_DATABASES)
class EmailBackendTest(TestCase):
    """Tests for the custom EmailBackend authentication."""

    def setUp(self):
        self.backend = EmailBackend()
        self.user = User.objects.create_user(
            username='auth@test.edu',
            email='auth@test.edu',
            password='SecurePass123',
        )

    def test_authenticate_success(self):
        """Correct email + password returns the user."""
        result = self.backend.authenticate(None, email='auth@test.edu', password='SecurePass123')
        self.assertEqual(result, self.user)

    def test_authenticate_wrong_password(self):
        """Wrong password returns None."""
        result = self.backend.authenticate(None, email='auth@test.edu', password='WrongPass')
        self.assertIsNone(result)

    def test_authenticate_nonexistent_email(self):
        """Non-existent email returns None."""
        result = self.backend.authenticate(None, email='nobody@test.edu', password='any')
        self.assertIsNone(result)

    def test_authenticate_none_params(self):
        """None email or password returns None."""
        self.assertIsNone(self.backend.authenticate(None, email=None, password='x'))
        self.assertIsNone(self.backend.authenticate(None, email='auth@test.edu', password=None))
        self.assertIsNone(self.backend.authenticate(None, email=None, password=None))
