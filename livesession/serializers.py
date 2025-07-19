from rest_framework import serializers

class SessionSerializer(serializers.Serializer):
    """Serializer pour gérer les données de session."""
    
    # Profil sélectionné
    profile_id = serializers.IntegerField(required=False, allow_null=True)
    
    # Données du poste
    shift_id = serializers.IntegerField(required=False, allow_null=True)
    operator_id = serializers.IntegerField(required=False, allow_null=True)
    shift_date = serializers.DateField(required=False, allow_null=True)
    vacation = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    start_time = serializers.TimeField(required=False, allow_null=True)
    end_time = serializers.TimeField(required=False, allow_null=True)
    
    # États machine
    machine_started_start = serializers.BooleanField(required=False, allow_null=True, default=False)
    machine_started_end = serializers.BooleanField(required=False, allow_null=True, default=False)
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
    
    def update(self, instance, validated_data):
        """Met à jour la session avec les données validées."""
        # instance = request.session
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
                else:
                    instance[key] = value
        instance.save()  # Important pour persister
        return instance