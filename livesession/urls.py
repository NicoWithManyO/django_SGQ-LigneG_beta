from django.urls import path
from .views import SessionAPIView

app_name = 'livesession'

urlpatterns = [
    path('api/session/', SessionAPIView.as_view(), name='session-api'),
]