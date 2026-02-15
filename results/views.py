from django.shortcuts import render

# Create your views here.
from rest_framework import generics
from .models import Announcement
from .serializers import AnnouncementSerializer

class AnnouncementList(generics.ListCreateAPIView):
    queryset = Announcement.objects.all()
    serializer_class = AnnouncementSerializer