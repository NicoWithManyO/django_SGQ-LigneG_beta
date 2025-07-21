from rest_framework import viewsets, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.db import transaction
from .models import Roll
from .serializers import RollSerializer
from .services import roll_service


class RollViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la gestion des rouleaux.
    
    Endpoints:
    - GET /api/production/rolls/ - Liste des rouleaux de la session
    - POST /api/production/rolls/ - Créer un nouveau rouleau
    - GET /api/production/rolls/{id}/ - Détail d'un rouleau
    """
    
    serializer_class = RollSerializer
    permission_classes = [AllowAny]  # TODO: Ajouter permissions appropriées
    
    def get_queryset(self):
        """Retourne les rouleaux de la session courante."""
        queryset = Roll.objects.all()
        
        # Filtrer par session si disponible
        if self.request.session.session_key:
            queryset = queryset.for_session(self.request.session.session_key)
        
        # Prefetch les relations pour optimiser
        queryset = queryset.prefetch_related(
            'thickness_measurements',
            'defects__defect_type'
        )
        
        return queryset.order_by('-created_at')
    
    def create(self, request):
        """
        Crée un nouveau rouleau avec ses mesures.
        
        La logique métier est déléguée au service.
        """
        # Valider les données
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Préparer les données de session
        session_data = {
            'shift_id': serializer.validated_data.get('shift_id_str') or request.session.get('shift_id'),
            'session_key': request.session.session_key,
        }
        
        # Vérifier qu'on a bien un shift_id
        if not session_data['shift_id']:
            return Response(
                {'error': 'Aucun poste actif trouvé dans la session'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Créer le rouleau via le service
            roll = roll_service.create_roll_with_measurements(
                serializer.validated_data,
                session_data
            )
            
            # Sérialiser la réponse
            response_serializer = self.get_serializer(roll)
            
            return Response(
                response_serializer.data,
                status=status.HTTP_201_CREATED
            )
            
        except Exception as e:
            # Log l'erreur
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Erreur création rouleau: {str(e)}", exc_info=True)
            
            return Response(
                {'error': 'Erreur lors de la création du rouleau'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )