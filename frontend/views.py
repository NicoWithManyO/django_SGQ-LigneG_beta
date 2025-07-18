from django.shortcuts import render
from planification.models import Operator
import json


def index(request):
    return render(request, 'frontend/pages/index.html')


def production(request):
    operators = Operator.objects.filter(is_active=True).order_by('first_name', 'last_name')
    
    # Récupérer les données de session
    session_data = {
        'operator_id': request.session.get('operator_id', ''),
        'shift_date': request.session.get('shift_date', ''),
        'vacation': request.session.get('vacation', ''),
        'start_time': request.session.get('start_time', ''),
        'end_time': request.session.get('end_time', ''),
    }
    
    context = {
        'operators': operators,
        'session_data': json.dumps(session_data),
    }
    return render(request, 'frontend/pages/production.html', context)
