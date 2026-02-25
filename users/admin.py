from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import CustomUser, StudentProfile


class StudentProfileInline(admin.StackedInline):
    model = StudentProfile
    can_delete = False


@admin.register(CustomUser)
class CustomUserAdmin(BaseUserAdmin):
    inlines = [StudentProfileInline]
    list_display = ["email", "get_full_name", "role", "identifier", "is_active"]
    list_filter = ["role", "is_active"]
    search_fields = ["email", "first_name", "last_name", "identifier"]
    ordering = ["-date_joined"]

    fieldsets = (
        ("Credentials", {"fields": ("email", "password")}),
        ("Personal Info", {"fields": ("first_name", "last_name", "identifier")}),
        ("Role & Permissions", {"fields": ("role", "is_active", "is_staff", "is_superuser")}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "first_name", "last_name", "identifier", "role", "password1", "password2"),
        }),
    )
    readonly_fields = ["date_joined", "last_login"]

    def get_inline_instances(self, request, obj=None):
        if obj and obj.role == CustomUser.Role.STUDENT:
            return super().get_inline_instances(request, obj)
        return []


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ["user", "department", "level"]
    search_fields = ["user__email", "user__first_name"]