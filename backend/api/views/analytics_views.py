# backend/api/views.py

import hashlib

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.core.cache import cache
from api.services.analysis_engine import analyze_faculty_performance
from ..services.cache_service import CACHE_TTL_MEDIUM, gap_analysis_cache_key


def _is_truthy(value):
    return str(value or '').strip().lower() in {'1', 'true', 'yes', 'y', 'on'}


def _build_fallback_analytics_payload(current_rank="Instructor I", warning=None):
    summary = {
        "KRA I": {"A": 0.0, "B": 0.0, "C": 0.0, "Total": 0.0},
        "KRA II": {"A": 0.0, "B": 0.0, "C": 0.0, "Total": 0.0},
        "KRA III": {"A": 0.0, "B": 0.0, "C": 0.0, "D": 0.0, "Total": 0.0},
        "KRA IV": {"A": 0.0, "B": 0.0, "C": 0.0, "D": 0.0, "Total": 0.0},
    }
    payload = {
        "summary": summary,
        "caps": {"KRA I": 100, "KRA II": 100, "KRA III": 100, "KRA IV": 100},
        "weights_used": {"KRA I": 0.60, "KRA II": 0.10, "KRA III": 0.20, "KRA IV": 0.10},
        "promotion": {
            "current_rank": current_rank,
            "projected_rank": current_rank,
            "increments": 0,
            "weighted_score": 0.0,
            "points_to_next_bracket": 41.0,
            "status_message": "No analytics data available yet",
        },
        "raw_totals": {"KRA I": 0.0, "KRA II": 0.0, "KRA III": 0.0, "KRA IV": 0.0},
    }
    if warning:
        payload["warning"] = warning
    return payload

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def faculty_gap_analysis(request):
    """
    Endpoint: /api/analytics/gap-analysis/
    Returns:
    - Raw Scores vs Caps
    - Weighted Scores & Promotion Projection
    - Strategic Recommendations
    """
    try:
        if not hasattr(request.user, 'faculty_profile'):
            return Response(
                _build_fallback_analytics_payload(
                    warning="Profile incomplete. Please complete your faculty profile to see analytics."
                )
            )
            
        profile = request.user.faculty_profile
        current_rank = profile.faculty_rank if profile.faculty_rank else "Instructor I"
        
        if not profile.sheet_url:
            return Response(
                _build_fallback_analytics_payload(
                    current_rank=current_rank,
                    warning="No Google Sheet linked yet. Please set your sheet URL in your profile.",
                )
            )

        sheet_hash = hashlib.md5(profile.sheet_url.encode('utf-8')).hexdigest()[:12]
        rank_token = current_rank.lower().replace(' ', '_')
        cache_key = gap_analysis_cache_key(request.user.id, rank_token, sheet_hash)
        cache_control = request.headers.get('Cache-Control', '')
        bypass_cache = _is_truthy(request.query_params.get('refresh')) or ('no-cache' in cache_control.lower())

        if not bypass_cache:
            cached_data = cache.get(cache_key)
            if cached_data is not None:
                return Response(cached_data)
        
        # Run Engine with Rank
        data = analyze_faculty_performance(profile.sheet_url, current_rank)

        if isinstance(data, dict) and data.get("error"):
            return Response(
                _build_fallback_analytics_payload(
                    current_rank=current_rank,
                    warning=f"Analytics source error: {data.get('error')}",
                ),
                status=502 # Use 502 Bad Gateway to trigger frontend fallback logic
            )

        cache.set(cache_key, data, CACHE_TTL_MEDIUM)
        
        return Response(data)
        
    except Exception as e:
        print(f"Gap Analysis Error: {e}")
        return Response(
            _build_fallback_analytics_payload(
                warning="Analytics is temporarily unavailable. Please try again in a moment."
            )
        )