from django.shortcuts import render
from django.db.models import Prefetch
from catalog.models import ProfileTemplate, ProfileSpecValue, ProfileParamValue
from catalog.serializers import ProfileTemplateSerializer
from production.models import CurrentProfile
from planification.models import Operator
import json


def production_view(request):
    """Vue principale de production."""
    # Récupérer le profil depuis CurrentProfile (source de vérité)
    try:
        current_profile_obj = CurrentProfile.objects.first()
        profile = current_profile_obj.profile if current_profile_obj else None
        
        # Synchroniser avec la session
        if profile:
            request.session['profile_id'] = profile.id
        else:
            request.session.pop('profile_id', None)
    except CurrentProfile.DoesNotExist:
        profile = None
        request.session.pop('profile_id', None)
    
    # Récupérer tous les profils avec leurs relations (prefetch pour optimiser)
    profiles = ProfileTemplate.objects.filter(is_active=True).prefetch_related(
        Prefetch('profilespecvalue_set', 
                 queryset=ProfileSpecValue.objects.select_related('spec_item')),
        Prefetch('profileparamvalue_set', 
                 queryset=ProfileParamValue.objects.select_related('param_item'))
    ).order_by('name')
    
    # Sérialiser tous les profils pour JavaScript
    profiles_data = ProfileTemplateSerializer(profiles, many=True).data
    
    # Récupérer les opérateurs actifs
    operators = Operator.objects.filter(is_active=True).order_by('first_name', 'last_name')
    
    # Récupérer l'opérateur depuis la session
    current_operator_id = request.session.get('operator_id')
    current_operator = None
    if current_operator_id:
        try:
            current_operator = Operator.objects.get(id=current_operator_id)
        except Operator.DoesNotExist:
            request.session.pop('operator_id', None)
    
    context = {
        'current_profile': profile,
        'profiles': profiles,
        'profiles_json': json.dumps(profiles_data),  # Pour Alpine.js
        'operators': operators,
        'current_operator': current_operator,
        # JSON pour JavaScript
        'current_operator_json': json.dumps({
            'id': current_operator.id,
            'first_name': current_operator.first_name,
            'last_name': current_operator.last_name
        }) if current_operator else 'null',
        # Données de session pour la fiche de poste
        'session_data': json.dumps({
            'shift_date': request.session.get('shift_date', ''),
            'vacation': request.session.get('vacation', ''),
            'start_time': request.session.get('start_time', ''),
            'end_time': request.session.get('end_time', ''),
        }),
    }
    
    return render(request, 'frontend/pages/production.html', context)