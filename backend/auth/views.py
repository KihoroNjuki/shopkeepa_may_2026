from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.exceptions import TokenError
from .models import EmailVerificationToken, PasswordResetToken
from .emails import send_password_reset_email
from .serializers import (
    CustomTokenObtainPairSerializer,
    RegisterSerializer,
    UserSerializer,
    ChangePasswordSerializer,
)

User = get_user_model()

class LoginView(TokenObtainPairView):
    """POST /api/auth/login/  →  { access, refresh, user }"""
    permission_classes = [AllowAny]
    serializer_class   = CustomTokenObtainPairSerializer


class RefreshView(TokenRefreshView):
    """POST /api/auth/refresh/  →  { access, refresh }"""
    pass


class RegisterView(generics.CreateAPIView):
    """POST /api/auth/register/  →  { user }"""
    permission_classes = [AllowAny]
    serializer_class   = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {'user': UserSerializer(user).data},
            status=status.HTTP_201_CREATED,
        )

class VerifyEmailView(APIView):
    """GET /api/auth/verify-email/?token=<uuid>"""
    permission_classes = [AllowAny]

    def get(self, request):
        token_param = request.query_params.get('token')
        print(f"Received token: {token_param}")

        if not token_param:
            return Response(
                {'detail': 'Token is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            token = EmailVerificationToken.objects.select_related('user').get(
                token=token_param
            )
        except EmailVerificationToken.DoesNotExist:
            return Response(
                {'detail': 'Invalid token.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if token.is_expired():
            token.delete()
            return Response(
                {'detail': 'Token has expired. Please register again.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = token.user
        user.is_active   = True
        user.is_verified = True
        user.save()
        token.delete()

        return Response({'detail': 'Email verified successfully. You can now log in.'})

class LogoutView(APIView):
    """POST /api/auth/logout/  — blacklists the refresh token."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response(
                {'detail': 'Refresh token required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            RefreshToken(refresh_token).blacklist()
        except TokenError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'detail': 'Logged out successfully.'})


class MeView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/auth/me/  — fetch or update current user's profile."""
    permission_classes = [IsAuthenticated]
    serializer_class   = UserSerializer

    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    """POST /api/auth/change-password/"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'detail': 'Password updated successfully.'})
    
class RequestPasswordResetView(APIView):
    """POST /api/auth/request-password-reset/"""
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response(
                {'detail': 'Email is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # always return 200 even if email doesn't exist — prevents user enumeration
        try:
            user = User.objects.get(email=email)
            send_password_reset_email(user)
        except User.DoesNotExist:
            pass

        return Response(
            {'detail': 'If that email exists, a reset link has been sent.'}
        )


class ResetPasswordView(APIView):
    """POST /api/auth/reset-password/"""
    permission_classes = [AllowAny]

    def post(self, request):
        token_param   = request.data.get('token')
        new_password  = request.data.get('new_password')

        print(f"Token received: {token_param}")
        print(f"Password received: {new_password}")

        if not token_param or not new_password:
            return Response(
                {'detail': 'Token and password are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            token = PasswordResetToken.objects.select_related('user').get(
                token=token_param,
                is_used=False
            )
        except PasswordResetToken.DoesNotExist:
            return Response(
                {'detail': 'Invalid or expired reset link.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if token.is_expired():
            token.delete()
            return Response(
                {'detail': 'Reset link has expired. Please request a new one.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = token.user
        user.set_password(new_password)
        user.save()

        token.is_used = True
        token.save()

        return Response({'detail': 'Password reset successfully. You can now log in.'})
    
class MeView(generics.RetrieveUpdateDestroyAPIView):
  """GET/PATCH/DELETE /auth/me/"""
  permission_classes = [IsAuthenticated]
  serializer_class   = UserSerializer

  def get_object(self):
    return self.request.user