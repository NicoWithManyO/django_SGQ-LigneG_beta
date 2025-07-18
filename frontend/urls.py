from django.urls import path
from . import views

app_name = 'frontend'

urlpatterns = [
    # Page principale de production
    path('', views.production_view, name='production'),
]