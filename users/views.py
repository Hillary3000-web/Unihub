"""
users/views.py

Simplified auth flows:
- Advisors: register with name + staff ID + password, login with staff ID + password
- Students: login with reg number only (reg number = password, auto-created from PDF)
"""

from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from django.contrib.auth import authenticate

from .serializers import (
    RegisterSerializer,
    UserMeSerializer,
    CustomTokenObtainPairSerializer,
    StudentLoginSerializer,
)


class RegisterView(generics.CreateAPIView):
    """POST /api/auth/register/ — Open. Creates Advisor account."""
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {
                "message": f"Account created successfully. Welcome, {user.get_full_name()}!",
                "identifier": user.identifier,
                "role": user.role,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(TokenObtainPairView):
    """POST /api/auth/login/ — Advisor login with staff ID + password."""
    permission_classes = [AllowAny]
    serializer_class = CustomTokenObtainPairSerializer


class StudentLoginView(APIView):
    """
    POST /api/auth/student-login/
    Students log in with their registration number only.
    The reg number serves as both username and password.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = StudentLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reg_number = serializer.validated_data["reg_number"].strip()

        from .models import CustomUser
        # Look up the student by identifier (reg number)
        try:
            student = CustomUser.objects.get(identifier__iexact=reg_number, role="STUDENT")
        except CustomUser.DoesNotExist:
            return Response(
                {"detail": "No student found with this registration number. Please contact your Course Advisor."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Authenticate using reg number as password
        user = authenticate(request, email=student.email, password=reg_number)
        if not user:
            return Response(
                {"detail": "Authentication failed. Your default password is your registration number."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # Issue JWT tokens
        refresh = RefreshToken.for_user(user)
        return Response({
            "access":     str(refresh.access_token),
            "refresh":    str(refresh),
            "role":       user.role,
            "full_name":  user.get_full_name(),
            "identifier": user.identifier,
            "email":      user.email,
        })


class LogoutView(APIView):
    """POST /api/auth/logout/ — Blacklists the refresh token."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response(
                {"error": "Refresh token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"message": "Logged out successfully."}, status=status.HTTP_205_RESET_CONTENT)
        except TokenError:
            return Response({"error": "Invalid or expired token."}, status=status.HTTP_400_BAD_REQUEST)


class MeView(generics.RetrieveAPIView):
    """GET /api/auth/me/ — Returns the current user's full profile."""
    permission_classes = [IsAuthenticated]
    serializer_class = UserMeSerializer

    def get_object(self):
        return self.request.user