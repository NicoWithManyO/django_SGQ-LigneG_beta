from django.shortcuts import render
from planification.models import Operator, FabricationOrder
import json


def index(request):
    return render(request, 'frontend/pages/index.html')


def production(request):
    operators = Operator.objects.filter(is_active=True).order_by('first_name', 'last_name')
    
    # Récupérer les ordres de fabrication non terminés
    fabrication_orders = FabricationOrder.objects.filter(terminated=False).order_by('-creation_date')
    cutting_orders = FabricationOrder.objects.filter(terminated=False, for_cutting=True).order_by('-creation_date')
    
    # Récupérer les données de session
    session_data = {
        'operator_id': request.session.get('operator_id', ''),
        'shift_date': request.session.get('shift_date', ''),
        'vacation': request.session.get('vacation', ''),
        'start_time': request.session.get('start_time', ''),
        'end_time': request.session.get('end_time', ''),
        'machine_started': request.session.get('machine_started', False),
        'machine_stopped': request.session.get('machine_stopped', False),
        'length_start': request.session.get('length_start', ''),
        'length_end': request.session.get('length_end', ''),
        'comment': request.session.get('comment', ''),
        # Ordre de fabrication
        'of_en_cours': request.session.get('of_en_cours', ''),
        'longueur_cible': request.session.get('longueur_cible', ''),
        'of_decoupe': request.session.get('of_decoupe', ''),
    }
    
    context = {
        'operators': operators,
        'fabrication_orders': fabrication_orders,
        'cutting_orders': cutting_orders,
        'session_data': json.dumps(session_data),
    }
    return render(request, 'frontend/pages/production.html', context)
