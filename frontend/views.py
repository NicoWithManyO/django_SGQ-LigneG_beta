from django.shortcuts import render
from catalog.models import ProfileTemplate, ProfileSpecValue, ProfileParamValue
from production.models import CurrentProfile


def production_view(request):
    """Vue principale de production."""
    # Récupérer le profil actuel
    try:
        current_profile = CurrentProfile.objects.first()
        profile = current_profile.profile if current_profile else None
    except CurrentProfile.DoesNotExist:
        profile = None
    
    # Récupérer tous les profils disponibles
    profiles = ProfileTemplate.objects.filter(is_active=True).order_by('name')
    
    context = {
        'current_profile': profile,
        'profiles': profiles,
    }
    
    return render(request, 'frontend/pages/production.html', context)


def test_view(request):
    """Vue de test."""
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
    from django.db.models import Prefetch
    profiles = ProfileTemplate.objects.filter(is_active=True).prefetch_related(
        Prefetch('profilespecvalue_set', 
                 queryset=ProfileSpecValue.objects.select_related('spec_item')),
        Prefetch('profileparamvalue_set', 
                 queryset=ProfileParamValue.objects.select_related('param_item'))
    ).order_by('name')
    
    # Sérialiser tous les profils pour JavaScript
    from catalog.serializers import ProfileTemplateSerializer
    profiles_data = ProfileTemplateSerializer(profiles, many=True).data
    
    import json
    context = {
        'current_profile': profile,
        'profiles': profiles,
        'profiles_json': json.dumps(profiles_data),  # Pour Alpine.js
    }
    
    return render(request, 'frontend/pages/test.html', context)