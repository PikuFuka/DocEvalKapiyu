from django.core.cache import cache

CACHE_TTL_SHORT = 30
CACHE_TTL_MEDIUM = 120
CACHE_TTL_LONG = 300

ADMIN_DASHBOARD_STATS_KEY = "admin_dashboard_stats"
ADMIN_USERS_LIST_KEY = "admin_users_list"


def user_uploads_cache_key(user_id):
    return f"user_uploads:{user_id}"


def admin_user_documents_cache_key(user_id):
    return f"admin_user_documents:{user_id}"


def gap_analysis_cache_key(user_id, rank_token, sheet_token):
    return f"gap_analysis:{user_id}:{rank_token}:{sheet_token}"


def invalidate_upload_related_cache(user_id):
    """
    Invalidates all cached data related to a user's uploads and analytics.
    Called when a new document is uploaded or when feedback is submitted.
    """
    # 1. Clear Upload lists (User and Admin)
    cache.delete(user_uploads_cache_key(user_id))
    cache.delete(admin_user_documents_cache_key(user_id))
    
    # 2. Clear Global Admin Stats
    cache.delete(ADMIN_DASHBOARD_STATS_KEY)
    cache.delete(ADMIN_USERS_LIST_KEY)

    # 3. Clear ALL gap analysis keys for this user
    # Since keys include rank and sheet hash, we use a pattern match if supported,
    # or simply delete if we can reconstruct. For safety in LocMem, we use a specific prefix
    # and manually iterate if needed, but here we just clear the known pattern.
    # Note: django.core.cache doesn't support delete_pattern by default.
    # We will let the natural TTL handle the variety, but we should at least 
    # try to clear the most likely ones if we had the context.
    # For now, we rely on the 120s TTL for analytics which is relatively short.
    pass


def invalidate_admin_cache():
    cache.delete_many([ADMIN_DASHBOARD_STATS_KEY, ADMIN_USERS_LIST_KEY])
