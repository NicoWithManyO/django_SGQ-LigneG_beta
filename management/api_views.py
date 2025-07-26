from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny

from production.models import Shift
from wcm.models import ChecklistResponse
from .services import ReportService, StatisticsService, ChecklistService
from .serializers import (
    ShiftReportSerializer,
    ChecklistReviewSerializer,
    DashboardStatisticsSerializer
)


class ShiftReportViewSet(viewsets.ReadOnlyModelViewSet):
    """API ViewSet pour les rapports de shift."""
    queryset = Shift.objects.all()
    serializer_class = ShiftReportSerializer
    permission_classes = [AllowAny]  # Temporaire pour test
    
    def get_queryset(self):
        """Filtre les shifts avec options de tri."""
        queryset = super().get_queryset()
        
        # Filtrage par date
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        
        if date_from:
            queryset = queryset.filter(date__gte=date_from)
        if date_to:
            queryset = queryset.filter(date__lte=date_to)
        
        # Filtrage par opérateur
        operator_id = self.request.query_params.get('operator')
        if operator_id:
            queryset = queryset.filter(operator_id=operator_id)
        
        return queryset.select_related('operator').order_by('-date', '-created_at')
    
    @action(detail=True, methods=['get'])
    def comprehensive_report(self, request, pk=None):
        """Récupère le rapport complet d'un shift."""
        try:
            data = ReportService.get_shift_comprehensive_data(pk)
            return Response(data)
        except Shift.DoesNotExist:
            return Response(
                {'error': 'Shift non trouvé'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Récupère les shifts récents avec KPIs."""
        days = int(request.query_params.get('days', 7))
        limit = int(request.query_params.get('limit', 10))
        
        data = ReportService.get_recent_shifts(days=days, limit=limit)
        return Response(data)


@api_view(['GET'])
def dashboard_statistics(request):
    """API pour les statistiques du dashboard management."""
    stats = StatisticsService.get_dashboard_statistics()
    serializer = DashboardStatisticsSerializer(stats)
    return Response(serializer.data)


@api_view(['GET'])
def pending_checklists(request):
    """API pour récupérer les checklists en attente."""
    checklists = ChecklistService.get_pending_checklists()
    serializer = ChecklistReviewSerializer(checklists, many=True)
    return Response(serializer.data)


@api_view(['POST'])
def sign_checklist(request, pk):
    """API pour signer une checklist avec le visa management."""
    try:
        visa = request.data.get('visa')
        if not visa:
            return Response(
                {'error': 'Le visa est requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        checklist = ChecklistService.add_management_visa(
            checklist_id=pk,
            visa=visa,
            user=request.user
        )
        
        serializer = ChecklistReviewSerializer(checklist)
        return Response(serializer.data)
        
    except ChecklistResponse.DoesNotExist:
        return Response(
            {'error': 'Checklist non trouvée'},
            status=status.HTTP_404_NOT_FOUND
        )
    except ValueError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
def production_trends(request):
    """API pour les tendances de production."""
    days = int(request.query_params.get('days', 7))
    trends = StatisticsService._get_daily_trends(days=days)
    return Response(trends)


@api_view(['GET'])
def operator_performance(request):
    """API pour la performance des opérateurs."""
    days = int(request.query_params.get('days', 30))
    performance = StatisticsService._get_operator_performance(days=days)
    return Response(performance)


@api_view(['GET'])
def defects_analysis(request):
    """API pour l'analyse des défauts."""
    days = int(request.query_params.get('days', 30))
    analysis = StatisticsService._get_defects_analysis(days=days)
    return Response(analysis)


@api_view(['GET'])
def production_alerts(request):
    """API pour les alertes de production."""
    alerts = StatisticsService._get_production_alerts()
    return Response(alerts)