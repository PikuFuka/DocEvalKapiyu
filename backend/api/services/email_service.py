from django.core.mail import send_mail
from django.conf import settings
from django.utils.crypto import get_random_string
from urllib.parse import quote
from sklearn import logger

def generate_verification_token():
    """Generate a random verification token."""
    return get_random_string(64)

def send_verification_email(user_email, verification_token):
    """Send email verification link to user."""
    frontend_url = str(getattr(settings, 'FRONTEND_URL', '')).strip().rstrip('/')
    encoded_token = quote(str(verification_token), safe='')
    verification_link = f"{frontend_url}/verify-email?token={encoded_token}"
    subject = 'Email Verification - DocEvalKapiyu'
    message = f'Please click the link to verify your email: {verification_link}'

    try:
        send_mail(
            subject,
            message,
            settings.EMAIL_HOST_USER,
            [user_email],
            fail_silently=False,
        )
    except Exception as e:
        # Log the error appropriately
        print(f"Failed to send verification email to {user_email}: {e}")
        logger.error(f"Failed to send verification email to {user_email}: {e}")