from decimal import Decimal
from django.db import transaction
from django.db.models import Avg, Q
from .models import Roll
from quality.models import RollThickness, RollDefect
from catalog.models import ProfileTemplate


class RollService:
    """Service contenant toute la logique métier pour les rouleaux."""
    
    @staticmethod
    def calculate_net_mass(total_mass, tube_mass):
        """Calcule la masse nette du rouleau."""
        if not total_mass or not tube_mass:
            return None
        
        net = Decimal(str(total_mass)) - Decimal(str(tube_mass))
        return net if net > 0 else None
    
    @staticmethod
    def calculate_grammage(net_mass, length, width=1):
        """Calcule le grammage (g/m²) du rouleau."""
        if not net_mass or not length or not width:
            return None
        
        # Surface en m²
        surface = Decimal(str(length)) * Decimal(str(width))
        if surface <= 0:
            return None
        
        # Grammage = masse nette (g) / surface (m²)
        grammage = Decimal(str(net_mass)) / surface
        return round(grammage, 2)
    
    @staticmethod
    def calculate_avg_thickness(thicknesses, side='left'):
        """
        Calcule la moyenne des épaisseurs pour un côté.
        side: 'left' pour GG, GC, GD ou 'right' pour DG, DC, DD
        """
        if not thicknesses:
            return None
        
        # Déterminer les points selon le côté
        if side == 'left':
            points = ['GG', 'GC', 'GD']
        else:
            points = ['DG', 'DC', 'DD']
        
        # Filtrer les épaisseurs du côté
        side_values = [
            t.thickness_value for t in thicknesses 
            if t.measurement_point in points
        ]
        
        if not side_values:
            return None
        
        # Calculer la moyenne
        avg = sum(side_values) / len(side_values)
        return round(avg, 2)
    
    @staticmethod
    def check_thickness_tolerance(thickness_value, profile_spec):
        """
        Vérifie si une épaisseur est dans les tolérances du profil.
        Retourne True si dans les tolérances, False sinon.
        """
        if not profile_spec:
            return True  # Pas de spec, on considère OK
        
        min_val = profile_spec.get('min')
        max_val = profile_spec.get('max')
        
        if min_val is not None and thickness_value < min_val:
            return False
        if max_val is not None and thickness_value > max_val:
            return False
        
        return True
    
    @staticmethod
    def determine_thickness_issues(thicknesses, profile=None):
        """Détermine s'il y a des problèmes d'épaisseur."""
        if not thicknesses:
            return False
        
        # Si on a un profil, vérifier les tolérances
        if profile:
            # TODO: Récupérer les specs d'épaisseur du profil
            # Pour l'instant, on vérifie juste is_within_tolerance
            pass
        
        # Vérifier s'il y a des épaisseurs hors tolérance
        return any(not t.is_within_tolerance for t in thicknesses)
    
    @staticmethod
    def determine_blocking_defects(defects):
        """Détermine s'il y a des défauts bloquants."""
        if not defects:
            return False
        
        # Un défaut est bloquant si son type a severity='blocking'
        for defect in defects:
            if defect.defect_type.severity == 'blocking':
                return True
        
        return False
    
    @staticmethod
    def determine_roll_status(has_thickness_issues, has_blocking_defects, grammage_ok=True):
        """
        Détermine le statut du rouleau selon les critères de conformité.
        Retourne 'CONFORME' ou 'NON_CONFORME'.
        """
        # Non conforme si :
        # - Défauts bloquants
        # - Problèmes d'épaisseur
        # - Grammage hors spec
        if has_blocking_defects or has_thickness_issues or not grammage_ok:
            return 'NON_CONFORME'
        
        return 'CONFORME'
    
    @staticmethod
    def determine_destination(status, force_cutting=False):
        """
        Détermine la destination du rouleau.
        """
        if force_cutting:
            return 'DECOUPE_FORCEE'
        
        if status == 'NON_CONFORME':
            return 'DECOUPE'
        
        return 'PRODUCTION'
    
    @transaction.atomic
    def create_roll_with_measurements(self, validated_data, session_data):
        """
        Crée un rouleau complet avec toutes ses mesures et calculs.
        
        Args:
            validated_data: Données validées du serializer
            session_data: Données de session (shift_id, session_key, etc.)
        
        Returns:
            Roll: Le rouleau créé
        """
        # Extraire les données nested
        thicknesses_data = validated_data.pop('thicknesses', [])
        defects_data = validated_data.pop('defects', [])
        
        # Gérer l'ordre de fabrication si un numéro est fourni
        roll_id = validated_data.get('roll_id', '')
        if roll_id and '_' in roll_id and not validated_data.get('fabrication_order'):
            # Extraire le numéro d'OF du roll_id (format: OF_NUM ou NUM_NUM)
            of_number = roll_id.split('_')[0]
            if of_number:
                # Chercher ou créer l'OF
                from planification.models import FabricationOrder
                try:
                    fabrication_order = FabricationOrder.objects.get(order_number=of_number)
                except FabricationOrder.DoesNotExist:
                    # Créer l'OF s'il n'existe pas
                    fabrication_order = FabricationOrder.objects.create(
                        order_number=of_number,
                        description=f'OF créé automatiquement depuis roll {roll_id}'
                    )
                validated_data['fabrication_order'] = fabrication_order
        
        # Ajouter les données de session
        validated_data['shift_id_str'] = session_data.get('shift_id')
        validated_data['session_key'] = session_data.get('session_key')
        
        # Calculer la masse nette
        net_mass = self.calculate_net_mass(
            validated_data.get('total_mass'),
            validated_data.get('tube_mass')
        )
        validated_data['net_mass'] = net_mass
        
        # Calculer le grammage
        grammage = self.calculate_grammage(
            net_mass,
            validated_data.get('length'),
            width=1  # TODO: Récupérer depuis le profil
        )
        validated_data['grammage_calc'] = grammage
        
        # Créer le rouleau
        roll = Roll.objects.create(**validated_data)
        
        # Créer les épaisseurs
        thickness_objects = []
        for thickness_data in thicknesses_data:
            thickness = RollThickness.objects.create(
                roll=roll,
                **thickness_data
            )
            thickness_objects.append(thickness)
        
        # Créer les défauts
        defect_objects = []
        for defect_data in defects_data:
            defect = RollDefect.objects.create(
                roll=roll,
                **defect_data
            )
            defect_objects.append(defect)
        
        # Calculer les moyennes d'épaisseur
        roll.avg_thickness_left = self.calculate_avg_thickness(
            thickness_objects, side='left'
        )
        roll.avg_thickness_right = self.calculate_avg_thickness(
            thickness_objects, side='right'
        )
        
        # Déterminer les problèmes
        roll.has_thickness_issues = self.determine_thickness_issues(
            thickness_objects
        )
        roll.has_blocking_defects = self.determine_blocking_defects(
            defect_objects
        )
        
        # Déterminer le statut si non fourni
        if not validated_data.get('status'):
            # TODO: Vérifier le grammage par rapport au profil
            grammage_ok = True  # Pour l'instant
            
            roll.status = self.determine_roll_status(
                roll.has_thickness_issues,
                roll.has_blocking_defects,
                grammage_ok
            )
        
        # Déterminer la destination si non fournie
        if not validated_data.get('destination'):
            roll.destination = self.determine_destination(roll.status)
        
        # Sauvegarder les changements
        roll.save()
        
        return roll


# Instance singleton du service
roll_service = RollService()