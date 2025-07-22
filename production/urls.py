from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api_views import RollViewSet, ShiftViewSet

# Router pour les API REST
router = DefaultRouter()
router.register(r'rolls', RollViewSet, basename='roll')
router.register(r'shifts', ShiftViewSet, basename='shift')

app_name = 'production'

urlpatterns = [
    # API endpoints
    path('api/', include(router.urls)),
]