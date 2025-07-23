from rest_framework import serializers

class SessionSerializer(serializers.Serializer):
    """Serializer pour gérer les données de session."""
    
    # Profil sélectionné
    profile_id = serializers.IntegerField(required=False, allow_null=True)
    belt_speed_mpm = serializers.DecimalField(max_digits=6, decimal_places=2, required=False, allow_null=True)
    
    # Données du poste
    shift_id = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    operator_id = serializers.IntegerField(required=False, allow_null=True)
    shift_date = serializers.DateField(required=False, allow_null=True)
    vacation = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    start_time = serializers.TimeField(required=False, allow_null=True)
    end_time = serializers.TimeField(required=False, allow_null=True)
    
    # États machine
    machine_started_start = serializers.BooleanField(required=False, allow_null=True)
    machine_started_end = serializers.BooleanField(required=False, allow_null=True)
    length_start = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    length_end = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    
    # Commentaire
    comment = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    
    # Ordre de fabrication
    of_en_cours = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    target_length = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    of_decoupe = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    
    # Sticky bar - Données du rouleau
    roll_number = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    tube_mass = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    roll_length = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    total_mass = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    next_tube_mass = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    
    # Données du rouleau (épaisseurs et défauts)
    roll_data = serializers.JSONField(required=False, allow_null=True)
    
    # Données checklist
    checklist_responses = serializers.JSONField(required=False, allow_null=True)
    checklist_signature = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    checklist_signature_time = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    
    # Contrôle qualité
    quality_control = serializers.JSONField(required=False, allow_null=True)
    
    # Temps perdus
    lost_time_entries = serializers.JSONField(required=False, allow_null=True)
    temps_total = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    has_startup_time = serializers.BooleanField(required=False, allow_null=True)
    last_roll_save_time = serializers.DateTimeField(required=False, allow_null=True)
    
    # Compteurs de production (longueurs enroulées)
    wound_length_ok = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    wound_length_nok = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    wound_length_total = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    
    def update(self, instance, validated_data):
        """Met à jour la session avec les données validées."""
        # instance = request.session
        
        # Convertir les Decimal en float pour éviter les erreurs de sérialisation
        for key in ['wound_length_ok', 'wound_length_nok', 'wound_length_total', 'belt_speed_mpm']:
            if key in validated_data and validated_data[key] is not None:
                validated_data[key] = float(validated_data[key])
        for key, value in validated_data.items():
            if value is None:
                # Supprimer de la session si None
                instance.pop(key, None)
            else:
                # Convertir les dates et heures en string pour la session
                if key == 'shift_date' and value:
                    instance[key] = value.isoformat()
                elif key in ['start_time', 'end_time'] and value:
                    instance[key] = value.strftime('%H:%M')
                elif key == 'last_roll_save_time' and value:
                    # Sauvegarder comme string ISO pour la session
                    instance[key] = value.isoformat() if hasattr(value, 'isoformat') else value
                else:
                    instance[key] = value
        instance.save()  # Important pour persister
        return instance