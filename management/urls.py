from django.urls import path, include
from rest_framework.routers import DefaultRouter

from . import views, api_views

# Router pour les ViewSets
router = DefaultRouter()
router.register(r'shift-reports', api_views.ShiftReportViewSet, basename='shift-report')

app_name = 'management'

urlpatterns = [
    # Pages de l'interface management
    path('', views.management_dashboard, name='dashboard'),
    path('reports/', views.shift_reports_list, name='reports-list'),
    path('reports/<int:shift_id>/', views.shift_report_detail, name='report-detail'),
    path('checklists/', views.checklist_review_list, name='checklists-list'),
    path('checklists/<int:checklist_id>/', views.checklist_detail, name='checklist-detail'),
    path('statistics/', views.production_statistics, name='statistics'),
    
    # API endpoints
    path('api/', include(router.urls)),
    path('api/dashboard-stats/', api_views.dashboard_statistics, name='api-dashboard-stats'),
    path('api/checklists/pending/', api_views.pending_checklists, name='api-pending-checklists'),
    path('api/checklists/<int:pk>/sign/', api_views.sign_checklist, name='api-sign-checklist'),
    path('api/trends/', api_views.production_trends, name='api-production-trends'),
    path('api/operator-performance/', api_views.operator_performance, name='api-operator-performance'),
    path('api/defects-analysis/', api_views.defects_analysis, name='api-defects-analysis'),
    path('api/alerts/', api_views.production_alerts, name='api-production-alerts'),
]