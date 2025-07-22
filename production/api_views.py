from rest_framework import viewsets, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.db import transaction
from .models import Roll, Shift
from .serializers import RollSerializer, ShiftSerializer
from .services import roll_service, shift_service


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


class ShiftViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la gestion des postes.
    
    Endpoints:
    - GET /api/shifts/ - Liste des postes
    - POST /api/shifts/ - Créer un nouveau poste
    - GET /api/shifts/{id}/ - Détail d'un poste
    """
    
    serializer_class = ShiftSerializer
    permission_classes = [AllowAny]  # TODO: Ajouter permissions appropriées
    
    def get_queryset(self):
        """Retourne les postes."""
        queryset = Shift.objects.all()
        
        # Prefetch les relations pour optimiser
        queryset = queryset.select_related('operator').prefetch_related(
            'checklist_responses__item',
            'lost_time_entries__reason',
            'rolls'
        )
        
        return queryset.order_by('-date', '-created_at')
    
    def create(self, request):
        """
        Crée un nouveau poste avec ses associations.
        
        La logique métier est déléguée au service.
        """
        # Valider les données de base
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Récupérer toutes les données de session nécessaires
        session_data = {
            'session_key': request.session.session_key,
            'checklist_responses': request.session.get('checklist_responses', {}),
            'checklist_signature': request.session.get('checklist_signature'),
            'checklist_signature_time': request.session.get('checklist_signature_time'),
        }
        
        # Ajouter les données de signature de checklist si présentes
        if session_data['checklist_signature']:
            serializer.validated_data['checklist_signed'] = session_data['checklist_signature']
        if session_data['checklist_signature_time']:
            serializer.validated_data['checklist_signed_time'] = session_data['checklist_signature_time']
        
        try:
            # Créer le poste via le service
            shift = shift_service.create_shift_with_associations(
                serializer.validated_data,
                session_data
            )
            
            # Sérialiser la réponse avec les données calculées
            response_serializer = self.get_serializer(shift)
            response_data = response_serializer.data
            
            # Ajouter des stats supplémentaires
            response_data['roll_count'] = shift.rolls.count()
            response_data['total_lost_time_minutes'] = int(shift.lost_time.total_seconds() / 60) if shift.lost_time else 0
            
            # Nettoyer la session après sauvegarde réussie
            self._clean_session(request)
            
            return Response(
                response_data,
                status=status.HTTP_201_CREATED
            )
            
        except Exception as e:
            # Log l'erreur
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Erreur création poste: {str(e)}", exc_info=True)
            
            return Response(
                {'error': f'Erreur lors de la création du poste: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _clean_session(self, request):
        """Nettoie les données de session après sauvegarde du poste."""
        # Liste des clés à supprimer
        keys_to_remove = [
            'shift_id',
            'operator_id',
            'shift_date',
            'vacation',
            'start_time',
            'end_time',
            'machine_started_start',
            'machine_started_end',
            'length_start',
            'length_end',
            'comment',
            'checklist_responses',
            'checklist_signature',
            'checklist_signature_time',
            'lost_time_entries',
            'roll_data',
            'quality_control',
            'qc_status',
            'has_startup_time'
        ]
        
        for key in keys_to_remove:
            request.session.pop(key, None)
        
        request.session.save()