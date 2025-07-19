from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum
from catalog.models import WcmLostTimeReason
from .models import LostTimeEntry
from .serializers import WcmLostTimeReasonSerializer, LostTimeEntrySerializer


class WcmLostTimeReasonViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet pour les motifs de temps perdu (lecture seule)"""
    queryset = WcmLostTimeReason.objects.filter(is_active=True)
    serializer_class = WcmLostTimeReasonSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        """Retourner les motifs actifs triés"""
        return super().get_queryset().order_by('category', 'order', 'name')


class LostTimeEntryViewSet(viewsets.ModelViewSet):
    """ViewSet pour les entrées de temps perdu"""
    serializer_class = LostTimeEntrySerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        """Retourner les entrées de la session courante"""
        queryset = LostTimeEntry.objects.all()
        
        # Filtrer par session courante
        if self.request.session.session_key:
            queryset = queryset.filter(
                session_key=self.request.session.session_key
            )
        
        return queryset.select_related('reason').order_by('-created_at')
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Obtenir les statistiques de temps perdu de la session"""
        entries = self.get_queryset()
        
        # Calculer le temps total
        total_duration = entries.aggregate(
            total=Sum('duration')
        )['total'] or 0
        
        # Compter les arrêts
        count = entries.count()
        
        # Grouper par catégorie
        by_category = entries.values(
            'reason__category', 'reason__name'
        ).annotate(
            duration_sum=Sum('duration')
        ).order_by('-duration_sum')
        
        return Response({
            'total_duration': total_duration,
            'count': count,
            'by_category': list(by_category)
        })