"""
users/models.py

CustomUser replaces Django's default User.
Roles: STUDENT | ADVISOR
"""

from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager


class CustomUserManager(BaseUserManager):
    """Manager using email as the unique login identifier."""

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("An email address is required.")
        email = self.normalize_email(email)
        extra_fields.setdefault("is_active", True)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", CustomUser.Role.ADVISOR)
        return self.create_user(email, password, **extra_fields)


class CustomUser(AbstractBaseUser, PermissionsMixin):
    """
    Core UniHub user.
    Students log in with matric number (identifier) e.g. CSC/2021/001
    Advisors log in with their Staff ID.
    """

    class Role(models.TextChoices):
        STUDENT = "STUDENT", "Student"
        ADVISOR = "ADVISOR", "Course Advisor"

    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)

    # Matric number for students, Staff ID for advisors
    identifier = models.CharField(
        max_length=50,
        unique=True,
        help_text="Matric number (students) or Staff ID (advisors)",
    )

    role = models.CharField(max_length=10, choices=Role.choices, default=Role.STUDENT)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = CustomUserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name", "identifier", "role"]

    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"
        ordering = ["-date_joined"]

    def __str__(self):
        return f"{self.get_full_name()} ({self.role}) — {self.identifier}"

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    @property
    def is_student(self):
        return self.role == self.Role.STUDENT

    @property
    def is_advisor(self):
        return self.role == self.Role.ADVISOR


class StudentProfile(models.Model):
    """Academic profile for students only (department, level)."""

    class Level(models.IntegerChoices):
        L100 = 100, "100 Level"
        L200 = 200, "200 Level"
        L300 = 300, "300 Level"
        L400 = 400, "400 Level"
        L500 = 500, "500 Level"

    user = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="student_profile",
    )
    department = models.CharField(max_length=100)
    level = models.IntegerField(choices=Level.choices, default=Level.L100)

    def __str__(self):
        return f"{self.user.get_full_name()} — {self.department} ({self.level}L)"