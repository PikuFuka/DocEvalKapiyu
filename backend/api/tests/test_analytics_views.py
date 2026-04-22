# api/tests/test_analytics_views.py

from datetime import date
from unittest.mock import patch

from django.test import TestCase, override_settings
from django.core.cache import cache
from rest_framework.test import APIClient
from rest_framework import status

from api.models import User, FacultyProfile


TEST_DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

MOCK_ANALYSIS_SUCCESS = {
    'summary': {
        'KRA I': {'A': 50, 'B': 10, 'C': 5, 'Total': 65},
        'KRA II': {'A': 20, 'B': 0, 'C': 0, 'Total': 20},
        'KRA III': {'A': 10, 'B': 15, 'C': 5, 'D': 0, 'Total': 30},
        'KRA IV': {'A': 5, 'B': 10, 'C': 3, 'D': 0, 'Total': 18},
    },
    'caps': {'KRA I': 100, 'KRA II': 100, 'KRA III': 100, 'KRA IV': 100},
    'weights_used': {'KRA I': 0.60, 'KRA II': 0.10, 'KRA III': 0.20, 'KRA IV': 0.10},
    'promotion': {
        'current_rank': 'Instructor I',
        'projected_rank': 'Instructor II',
        'increments': 1,
        'weighted_score': 46.8,
        'points_to_next_bracket': 4.2,
        'status_message': '+1 Sub-ranks',
    },
    'raw_totals': {'KRA I': 65, 'KRA II': 20, 'KRA III': 30, 'KRA IV': 18},
}


@override_settings(DATABASES=TEST_DATABASES)
class GapAnalysisViewTest(TestCase):
    """Tests for the faculty gap analysis endpoint."""

    def setUp(self):
        self.client = APIClient()
        self.url = '/api/analytics/gap-analysis/'
        self.user = User.objects.create_user(
            username='analytics@test.edu', email='analytics@test.edu', password='pass',
        )
        self.profile = FacultyProfile.objects.create(
            user=self.user,
            degree_name='BS CS',
            hei_name='Test U',
            year_graduated=2020,
            faculty_rank='Instructor I',
            date_of_appointment=date(2021, 1, 1),
            suc_name='SUC',
            campus='Main',
            address='Addr',
            sheet_url='https://docs.google.com/spreadsheets/d/abc123/edit',
        )
        self.client.force_authenticate(user=self.user)
        cache.clear()

    def test_gap_analysis_no_profile(self):
        """User without faculty_profile gets fallback data with warning."""
        user_no_profile = User.objects.create_user(
            username='noprof@test.edu', email='noprof@test.edu', password='pass',
        )
        self.client.force_authenticate(user=user_no_profile)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('warning', response.data)
        self.assertIn('Profile incomplete', response.data['warning'])

    def test_gap_analysis_no_sheet_url(self):
        """Profile without sheet_url gets fallback with sheet warning."""
        self.profile.sheet_url = None
        self.profile.save()
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('warning', response.data)
        self.assertIn('Google Sheet', response.data['warning'])

    @patch('api.views.analytics_views.analyze_faculty_performance', return_value=MOCK_ANALYSIS_SUCCESS)
    def test_gap_analysis_success(self, mock_analyze):
        """Successful analysis returns 200 with all expected keys."""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('summary', response.data)
        self.assertIn('promotion', response.data)
        self.assertIn('weights_used', response.data)
        mock_analyze.assert_called_once()

    @patch('api.views.analytics_views.analyze_faculty_performance', return_value=MOCK_ANALYSIS_SUCCESS)
    def test_gap_analysis_cache_bypass(self, mock_analyze):
        """?refresh=true bypasses cache and calls engine again."""
        # First call — populates cache
        self.client.get(self.url)
        # Second call with refresh
        response = self.client.get(f'{self.url}?refresh=true')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(mock_analyze.call_count, 2)

    @patch('api.views.analytics_views.analyze_faculty_performance',
           return_value={'error': 'Sheet not accessible'})
    def test_gap_analysis_source_error(self, mock_analyze):
        """Engine error returns 502 with fallback payload."""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 502)
        self.assertIn('warning', response.data)

    @patch('api.views.analytics_views.analyze_faculty_performance',
           side_effect=Exception('Unexpected crash'))
    def test_gap_analysis_exception(self, mock_analyze):
        """Unexpected exception returns 200 with graceful fallback."""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('warning', response.data)
        self.assertIn('temporarily unavailable', response.data['warning'])
