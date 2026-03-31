from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ..models import DocumentUpload
from ..serializers import (
    DocumentUploadSerializer
)
from ..services.document_processing_service import (
    process_document_upload,
    get_drive_file_name,
    map_classification_to_evidence_type,
)

class DocumentUploadView(generics.ListCreateAPIView):
    serializer_class = DocumentUploadSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return DocumentUpload.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Save the upload record first
        upload = serializer.save(user=self.request.user)
        upload.status = "processing"
        upload.save(update_fields=['status'])
        try:
            process_document_upload(upload, classification_only=True)
        except Exception as e:
            print(f"Error processing upload {upload.id}: {e}")

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
    uploads = DocumentUpload.objects.filter(user=request.user).order_by('-created_at')
    serializer = DocumentUploadSerializer(uploads, many=True)
    return Response(serializer.data)


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

    success = process_document_upload(
        upload,
        classification_only=False,
        classification_override=classification_override,
    )
    upload.refresh_from_db()

    if not success:
        return Response(
            {'error': upload.error_message or 'Failed to process confirmed classification.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    serializer = DocumentUploadSerializer(upload)
    return Response(serializer.data, status=status.HTTP_200_OK)