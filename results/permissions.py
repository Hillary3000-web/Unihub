"""
results/permissions.py

Custom DRF permission classes for UniHub role-based access control.
Usage:
    from results.permissions import IsAdvisor, IsStudent

    class MyView(APIView):
        permission_classes = [IsAuthenticated, IsAdvisor]
"""

from rest_framework.permissions import BasePermission


class IsAdvisor(BasePermission):
    """Allows access only to users with role=ADVISOR."""
    message = "Access denied. Only Course Advisors can perform this action."

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == "ADVISOR"
        )


class IsStudent(BasePermission):
    """Allows access only to users with role=STUDENT."""
    message = "Access denied. Only Students can access this resource."

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == "STUDENT"
        )