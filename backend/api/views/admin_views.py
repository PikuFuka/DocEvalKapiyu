from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.core.cache import cache
from django.contrib.auth import get_user_model
from django.db.models import Count
User = get_user_model()

from ..models import DocumentUpload
from ..serializers import (
    AdminUserSerializer
)
from ..services.cache_service import (
    ADMIN_DASHBOARD_STATS_KEY,
    ADMIN_USERS_LIST_KEY,
    CACHE_TTL_SHORT,
    admin_user_documents_cache_key,
)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_dashboard_stats(request):
    if not request.user.is_staff:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    cached_payload = cache.get(ADMIN_DASHBOARD_STATS_KEY)
    if cached_payload is not None:
        return Response(cached_payload)

    total_faculty = User.objects.filter(is_staff=False).count()
    total_documents = DocumentUpload.objects.count()

    payload = {
        'total_faculty': total_faculty,
        'total_documents': total_documents
    }
    cache.set(ADMIN_DASHBOARD_STATS_KEY, payload, CACHE_TTL_SHORT)
    return Response(payload)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_users_list(request):
    if not request.user.is_staff:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    cached_payload = cache.get(ADMIN_USERS_LIST_KEY)
    if cached_payload is not None:
        return Response(cached_payload)

    # Get all faculty users with their profile
    faculty_users = (
        User.objects.filter(is_staff=False)
        .select_related('faculty_profile')
        .annotate(total_uploads=Count('document_uploads'))
    )
    serializer = AdminUserSerializer(faculty_users, many=True)
    payload = serializer.data
    cache.set(ADMIN_USERS_LIST_KEY, payload, CACHE_TTL_SHORT)
    return Response(payload)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_user_documents(request, user_id):
    if not request.user.is_staff:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    cache_key = admin_user_documents_cache_key(user_id)
    cached_payload = cache.get(cache_key)
    if cached_payload is not None:
        return Response(cached_payload)

    try:
        user = User.objects.get(id=user_id, is_staff=False)
        uploads = DocumentUpload.objects.filter(user=user).order_by('-created_at')

        # Format the response to include user info and their uploads
        user_data = {
            'user_id': user.id,
            'user_email': user.email,
            'user_name': f"{user.first_name} {user.last_name}",
            'user_sheet_url': user.faculty_profile.sheet_url if hasattr(user, 'faculty_profile') and user.faculty_profile.sheet_url else None,
            'uploads': [
                {
                    'id': upload.id,
                    'google_drive_link': upload.google_drive_link,
                    'status': upload.status,
                    'created_at': upload.created_at,
                    'google_sheet_link': upload.google_sheet_link
                }
                for upload in uploads
            ]
        }
        cache.set(cache_key, user_data, CACHE_TTL_SHORT)
        return Response(user_data)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
