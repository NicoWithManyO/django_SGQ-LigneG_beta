from rest_framework import viewsets, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.decorators import action, api_view
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
            queryset = queryset.filter(session_key=self.request.session.session_key)
        
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
            response_data = response_serializer.data
            
            # Ajouter l'heure de création pour le timer
            response_data['created_at'] = roll.created_at.isoformat()
            
            return Response(
                response_data,
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
    
    @action(detail=False, methods=['get'])
    def check_id(self, request):
        """Vérifie si un roll_id existe déjà."""
        roll_id = request.query_params.get('roll_id')
        
        if not roll_id:
            return Response(
                {'error': 'roll_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        exists = Roll.objects.filter(roll_id=roll_id).exists()
        
        return Response({
            'exists': exists,
            'roll_id': roll_id
        })


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
            'quality_control': request.session.get('quality_control', {}),
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
            
            # Préparer la session pour le prochain poste
            next_shift_data = self._prepare_next_shift(request, shift)
            
            # Ajouter les données du prochain poste dans la réponse
            response_data['next_shift_data'] = next_shift_data
            
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
    
    def _prepare_next_shift(self, request, saved_shift):
        """Prépare la session pour le prochain poste après sauvegarde."""
        # Utiliser les données du poste sauvé (pas de la session)
        machine_started_end = saved_shift.started_at_end
        meter_reading_end = saved_shift.meter_reading_end
        
        # Nettoyer toute la session
        self._clean_session(request)
        
        # Déterminer la vacation suivante
        vacation_map = {
            'Matin': 'ApresMidi',
            'ApresMidi': 'Nuit',
            'Nuit': 'Matin',
            'Journee': 'Journee'  # Journée reste Journée
        }
        next_vacation = vacation_map.get(saved_shift.vacation, 'Matin')
        
        # Préparer les données du prochain poste
        from datetime import date
        today = date.today()
        
        # Définir les heures par défaut selon la vacation
        default_hours = {
            'Matin': ('04:00', '12:00'),
            'ApresMidi': ('12:00', '20:00'),
            'Nuit': ('20:00', '04:00'),
            'Journee': ('07:30', '15:30')
        }
        
        start_time = default_hours.get(next_vacation, ('', ''))[0]
        end_time = default_hours.get(next_vacation, ('', ''))[1]
        
        # Données du prochain poste
        next_shift_data = {
            'shift_date': today.strftime('%Y-%m-%d'),
            'vacation': next_vacation,
            'start_time': start_time,
            'end_time': end_time,
            'machine_started_start': bool(machine_started_end and meter_reading_end),
            'length_start': str(meter_reading_end) if (machine_started_end and meter_reading_end) else '',
            'machine_started_end': True,
            'operator_id': '',  # Pas d'opérateur
            'comment': ''
        }
        
        # Sauvegarder en session
        for key, value in next_shift_data.items():
            request.session[key] = value
        
        request.session.save()
        
        # Retourner les données pour la réponse
        return next_shift_data
    
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
            # 'roll_data',  # NE PAS nettoyer les données du rouleau en cours !
            'quality_control',
            'qc_status',
            'has_startup_time',
            # Nettoyer aussi les données de session du formulaire
            'shift_form'
        ]
        
        for key in keys_to_remove:
            request.session.pop(key, None)
        
        request.session.save()
    
    @action(detail=False, methods=['get'])
    def check_id(self, request):
        """Vérifie si un shift_id existe déjà."""
        shift_id = request.query_params.get('shift_id')
        
        if not shift_id:
            return Response(
                {'error': 'shift_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        exists = Shift.objects.filter(shift_id=shift_id).exists()
        
        return Response({
            'exists': exists,
            'shift_id': shift_id
        })


# Vues API simples pour la vérification d'unicité
@api_view(['GET'])
def check_roll_id(request):
    """Vérifie si un roll_id existe déjà."""
    roll_id = request.query_params.get('roll_id')
    
    if not roll_id:
        return Response(
            {'error': 'roll_id parameter is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    exists = Roll.objects.filter(roll_id=roll_id).exists()
    
    return Response({
        'exists': exists,
        'roll_id': roll_id
    })


@api_view(['GET'])
def check_shift_id(request):
    """Vérifie si un shift_id existe déjà."""
    shift_id = request.query_params.get('shift_id')
    
    if not shift_id:
        return Response(
            {'error': 'shift_id parameter is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    exists = Shift.objects.filter(shift_id=shift_id).exists()
    
    return Response({
        'exists': exists,
        'shift_id': shift_id
    })