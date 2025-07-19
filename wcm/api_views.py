from rest_framework import viewsets, permissions
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from django.db.models import Sum
from catalog.models import WcmLostTimeReason, WcmChecklistTemplate
from .models import LostTimeEntry, Mode
from .serializers import WcmLostTimeReasonSerializer, LostTimeEntrySerializer, ModeSerializer


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


@api_view(['GET'])
def checklist_template_default(request):
    """Retourner le template de checklist par défaut"""
    try:
        # Chercher le template par défaut
        template = WcmChecklistTemplate.objects.filter(is_default=True).first()
        
        if not template:
            # Si pas de template par défaut, prendre le premier actif
            template = WcmChecklistTemplate.objects.filter(is_active=True).first()
        
        if template:
            # Retourner les items du template
            items = []
            # Récupérer les items via la relation through
            template_items = template.wcmchecklisttemplateitem_set.select_related('item').order_by('order')
            
            for template_item in template_items:
                # On récupère uniquement ce qui existe vraiment
                items.append({
                    'id': template_item.item.id,
                    'text': template_item.item.text,
                    'category': template_item.item.category,
                    'is_required': template_item.is_required,
                    'order': template_item.order
                })
            
            return Response({
                'id': template.id,
                'name': template.name,
                'items': items
            })
        
        # Aucun template trouvé - retourner une réponse vide mais valide
        return Response({
            'id': None,
            'name': 'Aucun template',
            'items': []
        })
        
    except Exception as e:
        print(f"Erreur checklist-template-default: {e}")
        import traceback
        traceback.print_exc()
        # Retourner une réponse vide plutôt qu'une erreur 500
        return Response({
            'id': None,
            'name': 'Erreur',
            'items': []
        })


class ModeViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet pour les modes de fonctionnement (lecture seule)"""
    queryset = Mode.objects.filter(is_active=True)
    serializer_class = ModeSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        """Retourner les modes actifs"""
        return super().get_queryset().order_by('name')
    
    @action(detail=True, methods=['post'])
    def toggle(self, request, pk=None):
        """Activer/désactiver un mode."""
        mode = self.get_object()
        mode.is_enabled = not mode.is_enabled
        mode.save()
        
        return Response({
            'id': mode.id,
            'name': mode.name,
            'is_enabled': mode.is_enabled
        })