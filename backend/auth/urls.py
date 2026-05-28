from django.urls import path
from .views import (
    LoginView,
    RefreshView,
    RegisterView,
    LogoutView,
    MeView,
    ChangePasswordView,
    VerifyEmailView,
    RequestPasswordResetView,
    ResetPasswordView,
)

urlpatterns = [
    path('login/',           LoginView.as_view(),         name='auth-login'),
    path('refresh/',         RefreshView.as_view(),        name='auth-refresh'),
    path('register/',        RegisterView.as_view(),       name='auth-register'),
    path('logout/',          LogoutView.as_view(),         name='auth-logout'),
    path('me/',              MeView.as_view(),             name='auth-me'),
    path('change-password/', ChangePasswordView.as_view(), name='auth-change-password'),
    path('verify-email/', VerifyEmailView.as_view(), name='auth-verify-email'),
    path('request-password-reset/', RequestPasswordResetView.as_view(), name='auth-request-password-reset'),
    path('reset-password/',         ResetPasswordView.as_view(),        name='auth-reset-password'),
]