from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api_views import WcmLostTimeReasonViewSet, LostTimeEntryViewSet

# Créer le router pour l'API
router = DefaultRouter()
router.register(r'lost-time-reasons', WcmLostTimeReasonViewSet)
router.register(r'lost-time-entries', LostTimeEntryViewSet, basename='losttimeentry')

app_name = 'wcm'
urlpatterns = [
    path('api/', include(router.urls)),
]