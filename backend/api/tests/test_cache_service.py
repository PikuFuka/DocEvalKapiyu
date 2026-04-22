# api/tests/test_cache_service.py

from django.test import TestCase
from django.core.cache import cache

from api.services.cache_service import (
    CACHE_TTL_SHORT,
    CACHE_TTL_MEDIUM,
    CACHE_TTL_LONG,
    ADMIN_DASHBOARD_STATS_KEY,
    ADMIN_USERS_LIST_KEY,
    user_uploads_cache_key,
    admin_user_documents_cache_key,
    gap_analysis_cache_key,
    invalidate_upload_related_cache,
    invalidate_admin_cache,
)


class CacheKeyFormatTest(TestCase):
    """Tests for cache key generation functions."""

    def test_user_uploads_cache_key(self):
        """Returns 'user_uploads:<id>' format."""
        self.assertEqual(user_uploads_cache_key(42), 'user_uploads:42')

    def test_admin_user_documents_cache_key(self):
        """Returns 'admin_user_documents:<id>' format."""
        self.assertEqual(admin_user_documents_cache_key(7), 'admin_user_documents:7')

    def test_gap_analysis_cache_key(self):
        """Returns 'gap_analysis:<uid>:<rank>:<hash>' format."""
        key = gap_analysis_cache_key(1, 'instructor_i', 'abc123')
        self.assertEqual(key, 'gap_analysis:1:instructor_i:abc123')


class CacheTTLTest(TestCase):
    """Tests for cache TTL constants."""

    def test_ttl_short(self):
        """CACHE_TTL_SHORT is 30 seconds."""
        self.assertEqual(CACHE_TTL_SHORT, 30)

    def test_ttl_medium(self):
        """CACHE_TTL_MEDIUM is 120 seconds."""
        self.assertEqual(CACHE_TTL_MEDIUM, 120)

    def test_ttl_long(self):
        """CACHE_TTL_LONG is 300 seconds."""
        self.assertEqual(CACHE_TTL_LONG, 300)


class InvalidateCacheTest(TestCase):
    """Tests for cache invalidation functions."""

    def setUp(self):
        cache.clear()

    def test_invalidate_upload_related_cache(self):
        """invalidate_upload_related_cache clears user and admin keys."""
        user_id = 5
        cache.set(user_uploads_cache_key(user_id), 'data')
        cache.set(admin_user_documents_cache_key(user_id), 'data')
        cache.set(ADMIN_DASHBOARD_STATS_KEY, 'stats')
        cache.set(ADMIN_USERS_LIST_KEY, 'users')

        invalidate_upload_related_cache(user_id)

        self.assertIsNone(cache.get(user_uploads_cache_key(user_id)))
        self.assertIsNone(cache.get(admin_user_documents_cache_key(user_id)))
        self.assertIsNone(cache.get(ADMIN_DASHBOARD_STATS_KEY))
        self.assertIsNone(cache.get(ADMIN_USERS_LIST_KEY))

    def test_invalidate_admin_cache(self):
        """invalidate_admin_cache clears admin dashboard and users keys."""
        cache.set(ADMIN_DASHBOARD_STATS_KEY, 'stats')
        cache.set(ADMIN_USERS_LIST_KEY, 'users')

        invalidate_admin_cache()

        self.assertIsNone(cache.get(ADMIN_DASHBOARD_STATS_KEY))
        self.assertIsNone(cache.get(ADMIN_USERS_LIST_KEY))

    def test_invalidate_does_not_affect_other_keys(self):
        """invalidate_admin_cache doesn't remove unrelated cache entries."""
        cache.set('unrelated_key', 'keep_me')
        cache.set(ADMIN_DASHBOARD_STATS_KEY, 'remove')

        invalidate_admin_cache()

        self.assertEqual(cache.get('unrelated_key'), 'keep_me')
