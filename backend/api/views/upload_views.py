from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.core.cache import cache

from ..models import DocumentUpload
from ..serializers import (
    DocumentUploadSerializer
)
from ..services.document_processing_service import (
    process_document_upload,
    get_drive_file_name,
    map_classification_to_evidence_type,
)
from ..services.cache_service import (
    CACHE_TTL_SHORT,
    invalidate_upload_related_cache,
    user_uploads_cache_key,
)

class DocumentUploadView(generics.ListCreateAPIView):
    serializer_class = DocumentUploadSerializer
    permission_classes = [IsAuthenticated]
    max_batch_links = 5

    def get_queryset(self):
        return DocumentUpload.objects.filter(user=self.request.user).order_by('-created_at')

    def _normalize_links(self, request):
        links_payload = request.data.get('google_drive_links')
        if links_payload is None:
            single_link = request.data.get('google_drive_link')
            links_payload = [single_link] if single_link is not None else []

        if isinstance(links_payload, str):
            links_payload = [links_payload]

        if not isinstance(links_payload, list):
            return None

        links = [str(link).strip() for link in links_payload if str(link).strip()]
        return links

    def create(self, request, *args, **kwargs):
        pending_review_count = DocumentUpload.objects.filter(
            user=request.user,
            status='for_review',
        ).count()

        if pending_review_count > 0:
            return Response(
                {
                    'error': 'Finish reviewing all pending classification results before starting another classification batch.',
                    'pending_review_count': pending_review_count,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        links = self._normalize_links(request)
        if links is None:
            return Response(
                {'error': 'Invalid payload. Provide google_drive_link or google_drive_links list.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not links:
            return Response({'error': 'No link provided'}, status=status.HTTP_400_BAD_REQUEST)

        if len(links) > self.max_batch_links:
            return Response(
                {'error': f'Maximum of {self.max_batch_links} links per submission.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializers = []
        for link in links:
            serializer = self.get_serializer(data={'google_drive_link': link})
            serializer.is_valid(raise_exception=True)
            serializers.append(serializer)

        uploads = []
        for serializer in serializers:
            upload = serializer.save(user=request.user)
            upload.status = "processing"
            upload.save(update_fields=['status'])
            uploads.append(upload)

        invalidate_upload_related_cache(request.user.id)

        for upload in uploads:
            try:
                process_document_upload(upload, classification_only=True)
            except Exception as e:
                print(f"Error processing upload {upload.id}: {e}")
            finally:
                upload.refresh_from_db()

        invalidate_upload_related_cache(request.user.id)

        output_serializer = DocumentUploadSerializer(uploads, many=True)
        if len(uploads) == 1:
            return Response(output_serializer.data[0], status=status.HTTP_201_CREATED)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def peek_drive_link(request):
    """
    Endpoint to preview a Google Drive link's name before uploading.
    """
    link = request.data.get('link')
    if not link:
        return Response({'error': 'No link provided'}, status=400)
    
    try:
        metadata = get_drive_file_name(link)
        return Response(metadata)
    except ValueError as e:
        return Response({'error': str(e)}, status=400)
    except Exception as e:
        print(f"Peek error: {e}")
        return Response({'error': 'Could not access link. Check permissions.'}, status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_uploads_list(request):
    cache_key = user_uploads_cache_key(request.user.id)
    try:
        cached_payload = cache.get(cache_key)
    except Exception as cache_error:
        print(f"Cache read failed for user uploads ({request.user.id}): {cache_error}")
        cached_payload = None

    if cached_payload is not None:
        return Response(cached_payload)

    uploads = DocumentUpload.objects.filter(user=request.user).order_by('-created_at')
    serializer = DocumentUploadSerializer(uploads, many=True)
    payload = serializer.data

    try:
        cache.set(cache_key, payload, CACHE_TTL_SHORT)
    except Exception as cache_error:
        print(f"Cache write failed for user uploads ({request.user.id}): {cache_error}")

    return Response(payload)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def confirm_upload_classification(request, upload_id):
    try:
        upload = DocumentUpload.objects.get(id=upload_id, user=request.user)
    except DocumentUpload.DoesNotExist:
        return Response({'error': 'Upload not found.'}, status=status.HTTP_404_NOT_FOUND)

    if upload.status == 'failed':
        return Response({'error': 'This upload already failed. Please upload again.'}, status=status.HTTP_400_BAD_REQUEST)

    if upload.status == 'completed':
        serializer = DocumentUploadSerializer(upload)
        return Response(serializer.data, status=status.HTTP_200_OK)

    if upload.status != 'for_review':
        return Response(
            {'error': 'Classification is still in progress. Please wait until the status is For Review.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    def _clean(value):
        return str(value).strip() if value is not None else ''

    classification_override = {
        'primary_kra': _clean(request.data.get('primary_kra', upload.primary_kra)),
        'criteria': _clean(request.data.get('criteria', upload.criteria)).upper(),
        'sub_criteria': _clean(request.data.get('sub_criteria', upload.sub_criteria)),
    }

    if not all([
        classification_override.get('primary_kra'),
        classification_override.get('criteria'),
        classification_override.get('sub_criteria'),
    ]):
        return Response(
            {'error': 'Please select KRA, Criterion, and Sub-Subcriterion before continuing.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    candidate = {
        'primary_kra': classification_override['primary_kra'],
        'criterion': classification_override['criteria'],
        'sub_criterion': classification_override['sub_criteria'],
    }

    if not map_classification_to_evidence_type(candidate):
        return Response(
            {'error': 'Invalid classification combination. Please choose a valid KRA/Criterion/Sub-Subcriterion.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    upload.status = 'processing'
    upload.error_message = None
    upload.save(update_fields=['status', 'error_message'])
    invalidate_upload_related_cache(upload.user_id)

    success = process_document_upload(
        upload,
        classification_only=False,
        classification_override=classification_override,
    )
    upload.refresh_from_db()
    invalidate_upload_related_cache(upload.user_id)

    if not success:
        return Response(
            {'error': upload.error_message or 'Failed to process confirmed classification.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    serializer = DocumentUploadSerializer(upload)
    return Response(serializer.data, status=status.HTTP_200_OK)