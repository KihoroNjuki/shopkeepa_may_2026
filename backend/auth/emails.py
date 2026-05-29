from django.core.mail import send_mail
from django.conf import settings
from .models import EmailVerificationToken


def send_verification_email(user):
    try:
        token, created = EmailVerificationToken.objects.get_or_create(user=user)
        print(f"Token created: {created}")
        print(f"Token value: {token.token}")
        print(f"User: {user.email}")

        verification_url = (
            f"{settings.FRONTEND_URL}/verify-email?token={token.token}"
        )

        send_mail(
            subject='Verify your email address',
            message=f'''
Hi {user.first_name or user.email},

Thanks for signing up! Please verify your email address by clicking the link below:

{verification_url}

This link expires in 24 hours.

If you didn't create an account, you can safely ignore this email.
            ''',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
    except Exception as e:
        print(f"Email sending failed: {e}")

def send_password_reset_email(user):
    from .models import PasswordResetToken
    try:
        # invalidate any existing tokens
        PasswordResetToken.objects.filter(user=user, is_used=False).delete()

        token = PasswordResetToken.objects.create(user=user)

        print(f"Reset token created: {token.token}")  
        print(f"Sending reset email to: {user.email}")

        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token.token}"

        send_mail(
            subject='Reset your password',
            message=f'''
    Hi {user.first_name or user.email},

    We received a request to reset your password. Click the link below to set a new one:

    {reset_url}

    This link expires in 1 hour.

    If you didn't request a password reset, you can safely ignore this email.
            ''',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
    except Exception as e:
        print(f"Email sending failed: {e}")