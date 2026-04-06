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
    cache.delete_many(
        [
            user_uploads_cache_key(user_id),
            admin_user_documents_cache_key(user_id),
            ADMIN_DASHBOARD_STATS_KEY,
            ADMIN_USERS_LIST_KEY,
        ]
    )


def invalidate_admin_cache():
    cache.delete_many([ADMIN_DASHBOARD_STATS_KEY, ADMIN_USERS_LIST_KEY])
