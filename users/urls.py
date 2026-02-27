"""
users/urls.py — Mounted at /api/auth/
"""

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import RegisterView, LoginView, StudentLoginView, LogoutView, MeView

urlpatterns = [
    path("register/",      RegisterView.as_view(),      name="auth-register"),
    path("login/",         LoginView.as_view(),         name="auth-login"),
    path("student-login/", StudentLoginView.as_view(),  name="auth-student-login"),
    path("logout/",        LogoutView.as_view(),        name="auth-logout"),
    path("token/refresh/", TokenRefreshView.as_view(),  name="token-refresh"),
    path("me/",            MeView.as_view(),            name="auth-me"),
]