from rest_framework import serializers
from django.db import transaction
from .models import Roll
from quality.models import RollThickness, RollDefect
from catalog.models import QualityDefectType


class RollThicknessSerializer(serializers.ModelSerializer):
    """Serializer pour les mesures d'épaisseur."""
    
    class Meta:
        model = RollThickness
        fields = [
            'meter_position', 
            'measurement_point',
            'thickness_value',
            'is_catchup',
            'is_within_tolerance'
        ]
        
    def validate_measurement_point(self, value):
        """Valide que le point de mesure est valide."""
        valid_points = ['GG', 'GC', 'GD', 'DG', 'DC', 'DD']
        if value not in valid_points:
            raise serializers.ValidationError(
                f"Point de mesure invalide. Doit être parmi : {', '.join(valid_points)}"
            )
        return value


class RollDefectSerializer(serializers.ModelSerializer):
    """Serializer pour les défauts du rouleau."""
    
    defect_type_id = serializers.PrimaryKeyRelatedField(
        queryset=QualityDefectType.objects.filter(is_active=True),
        source='defect_type'
    )
    
    class Meta:
        model = RollDefect
        fields = [
            'defect_type_id',
            'meter_position',
            'side_position',
            'comment'
        ]


class RollSerializer(serializers.ModelSerializer):
    """Serializer principal pour les rouleaux."""
    
    thicknesses = RollThicknessSerializer(many=True, required=False)
    defects = RollDefectSerializer(many=True, required=False)
    shift_id_str = serializers.CharField(required=True, write_only=True)
    
    # Champs calculés en lecture seule
    net_mass = serializers.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        read_only=True
    )
    grammage_calc = serializers.DecimalField(
        max_digits=7,
        decimal_places=2,
        read_only=True
    )
    
    class Meta:
        model = Roll
        fields = [
            'id',
            'roll_id',
            'roll_number',
            'fabrication_order',
            'shift_id_str',
            'length',
            'tube_mass',
            'total_mass',
            'net_mass',
            'grammage_calc',
            'status',
            'destination',
            'has_blocking_defects',
            'has_thickness_issues',
            'avg_thickness_left',
            'avg_thickness_right',
            'comment',
            'thicknesses',
            'defects',
            'created_at',
            'updated_at'
        ]
        read_only_fields = [
            'net_mass',
            'grammage_calc', 
            'has_blocking_defects',
            'has_thickness_issues',
            'avg_thickness_left',
            'avg_thickness_right',
            'created_at',
            'updated_at'
        ]
    
    def validate(self, attrs):
        """Validation globale du rouleau."""
        # Validation masse totale > masse tube
        total_mass = attrs.get('total_mass')
        tube_mass = attrs.get('tube_mass')
        
        if total_mass and tube_mass and total_mass <= tube_mass:
            raise serializers.ValidationError({
                'total_mass': 'La masse totale doit être supérieure à la masse du tube.'
            })
        
        return attrs
    
    @transaction.atomic
    def create(self, validated_data):
        """Création du rouleau avec ses relations."""
        # Extraire les données nested
        thicknesses_data = validated_data.pop('thicknesses', [])
        defects_data = validated_data.pop('defects', [])
        
        # Les champs de session seront ajoutés dans la vue
        # pour respecter la séparation des responsabilités
        
        # Créer le rouleau
        roll = Roll.objects.create(**validated_data)
        
        # Créer les épaisseurs
        for thickness_data in thicknesses_data:
            RollThickness.objects.create(roll=roll, **thickness_data)
        
        # Créer les défauts
        for defect_data in defects_data:
            RollDefect.objects.create(roll=roll, **defect_data)
        
        return roll
    
    def to_representation(self, instance):
        """Représentation du rouleau avec ses relations."""
        data = super().to_representation(instance)
        
        # Inclure les épaisseurs
        data['thicknesses'] = RollThicknessSerializer(
            instance.thickness_measurements.all(),
            many=True
        ).data
        
        # Inclure les défauts
        data['defects'] = RollDefectSerializer(
            instance.defects.all(),
            many=True
        ).data
        
        return data