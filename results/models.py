from django.db import models

# Create your models here.
from django.db import models
from django.contrib.auth.models import User

# For my Resource Hub
class StudyMaterial(models.Model):
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='materials/')
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

# For my Announcements System
class Announcement(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()
    is_urgent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)