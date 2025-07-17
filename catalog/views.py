from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from .models import ProfileTemplate
from .serializers import ProfileTemplateSerializer, ProfileTemplateListSerializer


class ProfileTemplateViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet pour la consultation des profils."""
    queryset = ProfileTemplate.objects.filter(is_active=True).order_by('name')
    permission_classes = [AllowAny]
    
    def get_serializer_class(self):
        """Utilise un serializer différent pour la liste et le détail."""
        if self.action == 'list':
            return ProfileTemplateListSerializer
        return ProfileTemplateSerializer
