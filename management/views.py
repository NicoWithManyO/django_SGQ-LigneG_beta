from django.shortcuts import render, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.utils import timezone

from production.models import Shift
from .services import ReportService, StatisticsService, ChecklistService


def management_dashboard(request):
    """Dashboard principal du management avec vue d'ensemble."""
    context = {
        'title': 'Tableau de bord Management',
        'today': timezone.now().date()
    }
    return render(request, 'management/pages/dashboard.html', context)


def shift_reports_list(request):
    """Liste des rapports de poste."""
    context = {
        'title': 'Rapports de poste'
    }
    return render(request, 'management/pages/reports.html', context)


def shift_report_detail(request, shift_id):
    """Détail d'un rapport de poste."""
    shift = get_object_or_404(Shift, pk=shift_id)
    report_data = ReportService.get_shift_comprehensive_data(shift_id)
    
    context = {
        'title': f'Rapport {shift.shift_id}',
        'report': report_data
    }
    return render(request, 'management/pages/shift_report.html', context)


def checklist_review_list(request):
    """Liste des checklists à réviser."""
    pending_checklists = ChecklistService.get_pending_checklists()
    
    context = {
        'title': 'Révision des checklists',
        'pending_checklists': pending_checklists
    }
    return render(request, 'management/pages/checklists.html', context)


def checklist_detail(request, checklist_id):
    """Détail d'une checklist."""
    checklist_data = ChecklistService.get_checklist_details(checklist_id)
    
    context = {
        'title': f'Checklist {checklist_data["checklist"].shift.shift_id}',
        'checklist_data': checklist_data
    }
    return render(request, 'management/pages/checklist_detail.html', context)


def production_statistics(request):
    """Statistiques de production avancées."""
    context = {
        'title': 'Statistiques de production'
    }
    return render(request, 'management/pages/statistics.html', context)
