from rest_framework import serializers

class SessionSerializer(serializers.Serializer):
    """Serializer pour gérer les données de session."""
    
    # Profil sélectionné
    profile_id = serializers.IntegerField(required=False, allow_null=True)
    
    # Autres données qu'on ajoutera plus tard
    shift_id = serializers.IntegerField(required=False, allow_null=True)
    operator_id = serializers.IntegerField(required=False, allow_null=True)
    
    def update(self, instance, validated_data):
        """Met à jour la session avec les données validées."""
        # instance = request.session
        for key, value in validated_data.items():
            if value is None:
                # Supprimer de la session si None
                instance.pop(key, None)
            else:
                # Sauvegarder dans la session
                instance[key] = value
        instance.save()  # Important pour persister
        return instance