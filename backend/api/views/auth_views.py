import logging
import time

from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import authenticate
from api.models import User
from django.db import transaction
from django.utils import timezone
from rest_framework.permissions import AllowAny

logger = logging.getLogger(__name__)

from ..models import FacultyProfile
from ..serializers import (
    FacultyRegistrationSerializer,
    UserSerializer,
    EmailVerificationSerializer,
    FacultyProfileSerializer
)
from ..services.email_service import generate_verification_token, send_verification_email
from ..services.google_sheets_service import create_user_google_sheet
from ..services.cache_service import invalidate_admin_cache

class FacultyRegistrationView(generics.CreateAPIView):
    serializer_class = FacultyRegistrationSerializer
    permission_classes = [AllowAny]

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Create faculty profile from request data
        profile_data = {
            'user': user,
            'degree_name': request.data.get('degree_name', ''),
            'hei_name': request.data.get('hei_name', ''),
            'year_graduated': request.data.get('year_graduated', 2000),
            'faculty_rank': request.data.get('faculty_rank', ''),
            'mode_of_appointment': request.data.get('mode_of_appointment', 'NBC 461'),
            'date_of_appointment': request.data.get('date_of_appointment', timezone.now().date()),
            'suc_name': request.data.get('suc_name', ''),
            'campus': request.data.get('campus', ''),
            'address': request.data.get('address', ''),
        }

        # Create Google Sheet for the user using the provided script
        try:
            user_sheet_url = create_user_google_sheet({
                'first_name': request.data.get('first_name', ''),
                'middle_name': request.data.get('middle_name', ''),
                'last_name': request.data.get('last_name', ''),
                'degree_name': request.data.get('degree_name', ''),
                'hei_name': request.data.get('hei_name', ''),
                'year_graduated': request.data.get('year_graduated', ''),
                'faculty_rank': request.data.get('faculty_rank', ''),
                'mode_of_appointment': request.data.get('mode_of_appointment', 'NBC 461'),
                'date_of_appointment': str(request.data.get('date_of_appointment', '')),
                'suc_name': request.data.get('suc_name', ''),
                'campus': request.data.get('campus', ''),
                'address': request.data.get('address', ''),
                'email': request.data.get('email', ''),
            })
        except Exception as e:
            logger.warning("Google Sheet creation failed for user %s: %s", user.email, e)
            user_sheet_url = None

        profile_data['sheet_url'] = user_sheet_url
        FacultyProfile.objects.create(**profile_data)
        invalidate_admin_cache()

        # Generate verification token
        verification_token = generate_verification_token()
        user.verification_token = verification_token
        user.save()

        # Send verification email
        try:
            send_verification_email(user.email, verification_token)
        except Exception as e:
            logger.error("Failed to send verification email to %s: %s", user.email, e)

        headers = self.get_success_headers(serializer.data)
        return Response({
            'user_id': user.id,
            'email': user.email,
            'message': 'Registration successful. Please check your email for verification.'
        }, status=status.HTTP_201_CREATED, headers=headers)

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def verify_email(request):
    token = request.GET.get('token') or request.data.get('token')
    if not token:
        return Response({'error': 'Missing token'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(verification_token=token)
    except User.DoesNotExist:
        return Response(
            {'error': 'Invalid or expired verification token.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    user.email_verified = True
    user.verification_token = None
    user.save()
    return Response({'message': 'Email verified successfully!'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    email = request.data.get('email')
    password = request.data.get('password')

    user = authenticate(request, email=email, password=password)
    logger.debug("Authentication attempt for %s: %s", email, 'success' if user else 'failed')

    if user:
        if not user.email_verified:
            return Response({'error': 'Please verify your email first'}, status=status.HTTP_400_BAD_REQUEST)

        from rest_framework.authtoken.models import Token
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user_id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'is_staff': user.is_staff,
            'email_verified': user.email_verified
        })

    return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile_view(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

class FacultyProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = FacultyProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        profile, created = FacultyProfile.objects.get_or_create(user=self.request.user)
        return profile

    def perform_update(self, serializer):
        serializer.save()
        invalidate_admin_cache()


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def warmup_inference_services(request):
    started_at = time.perf_counter()
    ml_ready = False
    ocr_ready = False
    errors = []

    try:
        from ..services.ml_processing_service import warmup_ml_model

        ml_ready = bool(warmup_ml_model())
    except Exception as exc:
        logger.warning("ML warmup failed for user %s: %s", request.user.id, exc)
        errors.append('ml')

    try:
        from ..services.document_processing_service import warmup_ocr_model

        ocr_ready = bool(warmup_ocr_model())
    except Exception as exc:
        logger.warning("OCR warmup failed for user %s: %s", request.user.id, exc)
        errors.append('ocr')

    duration_ms = int((time.perf_counter() - started_at) * 1000)

    return Response(
        {
            'all_ready': ml_ready and ocr_ready,
            'ml_ready': ml_ready,
            'ocr_ready': ocr_ready,
            'duration_ms': duration_ms,
            'errors': errors,
        },
        status=status.HTTP_200_OK,
    )
