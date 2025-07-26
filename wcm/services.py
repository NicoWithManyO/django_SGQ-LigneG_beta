from datetime import timedelta
from django.utils import timezone
from decimal import Decimal

from production.models import CurrentProfile
from .models import TRS


def calculate_and_create_trs(shift):
    """
    Calcule et crée l'objet TRS pour un shift.
    Réutilise la logique de ReportService mais avec la vraie vitesse du profil.
    
    Args:
        shift: Instance de Shift avec toutes ses données
        
    Returns:
        TRS: L'objet TRS créé
    """
    # Récupérer le profil actuel
    current_profile = CurrentProfile.objects.first()
    
    if current_profile and current_profile.profile:
        belt_speed = float(current_profile.profile.belt_speed_m_per_minute or 5.0)
        profile_name = current_profile.profile.name
    else:
        belt_speed = 5.0  # Fallback
        profile_name = "Par défaut"
    
    # Calculer le temps d'ouverture
    if shift.start_time and shift.end_time:
        start_datetime = timezone.datetime.combine(shift.date, shift.start_time)
        end_datetime = timezone.datetime.combine(shift.date, shift.end_time)
        
        # Gérer le cas où la fin est le lendemain (vacation Nuit)
        if end_datetime < start_datetime:
            end_datetime += timedelta(days=1)
        
        opening_time = end_datetime - start_datetime
    else:
        opening_time = timedelta(hours=8)  # 8h par défaut
    
    # Convertir les timings en minutes pour les calculs
    opening_time_minutes = opening_time.total_seconds() / 60
    
    # Temps disponible (déjà calculé dans shift)
    if shift.availability_time:
        available_time_minutes = shift.availability_time.total_seconds() / 60
    else:
        available_time_minutes = opening_time_minutes  # Si pas de temps perdu
    
    # Temps perdu (déjà calculé dans shift)
    if shift.lost_time:
        lost_time_minutes = shift.lost_time.total_seconds() / 60
    else:
        lost_time_minutes = 0
    
    # === CALCUL DES MÉTRIQUES TRS ===
    
    # 1. Disponibilité (%)
    if opening_time_minutes > 0:
        availability = (available_time_minutes / opening_time_minutes) * 100
    else:
        availability = 0
    
    # 2. Performance (%)
    actual_production = float(shift.total_length or 0)
    
    if actual_production > 0 and available_time_minutes > 0:
        # Production théorique = temps disponible × vitesse tapis
        theoretical_production = available_time_minutes * belt_speed
        performance = min(100, (actual_production / theoretical_production) * 100)
    else:
        theoretical_production = 0
        performance = 0
    
    # 3. Qualité (%)
    ok_length = float(shift.ok_length or 0)
    total_length = float(shift.total_length or 0)
    
    if total_length > 0:
        quality = (ok_length / total_length) * 100
    else:
        quality = 0
    
    # 4. TRS (%)
    trs = (availability * performance * quality) / 10000
    
    # Créer l'objet TRS
    trs_obj = TRS.objects.create(
        shift=shift,
        # Temps
        opening_time=opening_time,
        availability_time=shift.availability_time or timedelta(0),
        lost_time=shift.lost_time or timedelta(0),
        # Production (copie depuis shift)
        total_length=shift.total_length or 0,
        ok_length=shift.ok_length or 0,
        nok_length=shift.nok_length or 0,
        raw_waste_length=shift.raw_waste_length or 0,
        # Métriques calculées
        trs_percentage=round(trs, 1),
        availability_percentage=round(availability, 1),
        performance_percentage=round(performance, 1),
        quality_percentage=round(quality, 1),
        theoretical_production=round(theoretical_production, 2),
        # Profil
        profile_name=profile_name,
        belt_speed_m_per_min=belt_speed
    )
    
    return trs_obj