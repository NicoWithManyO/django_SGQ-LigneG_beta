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
        'machine_started_start': request.session.get('machine_started_start', False),
        'machine_started_end': request.session.get('machine_started_end', False),
        'length_start': request.session.get('length_start', ''),
        'length_end': request.session.get('length_end', ''),
        'comment': request.session.get('comment', ''),
        # Ordre de fabrication
        'of_en_cours': request.session.get('of_en_cours', ''),
        'target_length': request.session.get('target_length', ''),
        'of_decoupe': request.session.get('of_decoupe', ''),
        # Sticky bar
        'roll_number': request.session.get('roll_number', ''),
        'tube_mass': request.session.get('tube_mass', ''),
        'roll_length': request.session.get('roll_length', ''),
        'total_mass': request.session.get('total_mass', ''),
        'next_tube_mass': request.session.get('next_tube_mass', ''),
        # Données du rouleau
        'roll_data': request.session.get('roll_data', {}),
        # Données checklist
        'checklist_responses': request.session.get('checklist_responses', {}),
        'checklist_signature': request.session.get('checklist_signature', ''),
        'checklist_signature_time': request.session.get('checklist_signature_time', ''),
        # Contrôle qualité
        'quality_control': request.session.get('quality_control', {}),
        # Temps perdus
        'lost_time_entries': request.session.get('lost_time_entries', []),
        'temps_total': request.session.get('temps_total', '0h00'),
        'has_startup_time': request.session.get('has_startup_time', False),
    }
    
    # Préparer les données des opérateurs pour JS
    operators_data = list(operators.values('id', 'first_name', 'last_name', 'employee_id'))
    
    context = {
        'operators': operators,
        'fabrication_orders': fabrication_orders,
        'cutting_orders': cutting_orders,
        'session_data': json.dumps(session_data),
        'operators_json': json.dumps(operators_data),
    }
    return render(request, 'frontend/pages/production.html', context)
