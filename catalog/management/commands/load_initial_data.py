from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone
from catalog.models import (
    ParamItem, SpecItem, ProfileTemplate,
    WcmLostTimeReason, WcmChecklistTemplate, 
    WcmChecklistItem, QualityDefectType
)
from planification.models import Operator, FabricationOrder
from wcm.models import Mode, MoodCounter
import sys


class Command(BaseCommand):
    help = 'Charge les données initiales de référence dans la base de données'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Vider les données existantes avant de charger',
        )
        parser.add_argument(
            '--only',
            type=str,
            help='Charger seulement certains modèles (séparés par des virgules)',
        )
        parser.add_argument(
            '--skip',
            type=str,
            help='Ignorer certains modèles (séparés par des virgules)',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Mode simulation - afficher ce qui serait créé sans le faire',
        )

    def handle(self, *args, **options):
        self.dry_run = options.get('dry_run', False)
        self.clear = options.get('clear', False)
        
        # Déterminer quels modèles charger
        only_models = options.get('only', '').split(',') if options.get('only') else []
        skip_models = options.get('skip', '').split(',') if options.get('skip') else []
        
        # Liste ordonnée des fixtures à charger
        fixtures = [
            ('defect_types', self.load_defect_types),
            ('spec_items', self.load_spec_items),
            ('param_items', self.load_param_items),
            ('profiles', self.load_profiles),
            ('lost_time_reasons', self.load_lost_time_reasons),
            ('checklist_items', self.load_checklist_items),
            ('operators', self.load_operators),
            ('modes', self.load_modes),
            ('mood_counters', self.load_mood_counters),
        ]
        
        # Statistiques
        self.stats = {name: {'created': 0, 'updated': 0, 'skipped': 0} for name, _ in fixtures}
        
        if self.dry_run:
            self.stdout.write(self.style.WARNING('MODE SIMULATION - Aucune donnée ne sera créée'))
        
        try:
            with transaction.atomic():
                for fixture_name, loader_func in fixtures:
                    # Vérifier si on doit charger ce fixture
                    if only_models and fixture_name not in only_models:
                        continue
                    if skip_models and fixture_name in skip_models:
                        continue
                    
                    self.stdout.write(f'\n{self.style.MIGRATE_HEADING(f"Chargement: {fixture_name}")}')
                    loader_func()
                
                if self.dry_run:
                    # Annuler la transaction en mode dry-run
                    transaction.set_rollback(True)
                    
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Erreur: {str(e)}'))
            raise CommandError(f'Échec du chargement des données: {str(e)}')
        
        # Afficher le résumé
        self.print_summary()

    def print_summary(self):
        """Affiche un résumé des opérations."""
        self.stdout.write('\n' + self.style.SUCCESS('=== RÉSUMÉ ==='))
        
        total_created = 0
        total_updated = 0
        total_skipped = 0
        
        for fixture_name, stats in self.stats.items():
            if stats['created'] or stats['updated'] or stats['skipped']:
                self.stdout.write(
                    f"{fixture_name}: "
                    f"{stats['created']} créés, "
                    f"{stats['updated']} mis à jour, "
                    f"{stats['skipped']} ignorés"
                )
                total_created += stats['created']
                total_updated += stats['updated']
                total_skipped += stats['skipped']
        
        self.stdout.write(f"\nTOTAL: {total_created} créés, {total_updated} mis à jour, {total_skipped} ignorés")

    def load_defect_types(self):
        """Charge les types de défauts qualité."""
        defect_types = [
            {
                'name': 'Trou',
                'severity': 'blocking',
                'description': 'Perforation dans le matériau'
            },
            {
                'name': 'Pli',
                'severity': 'non_blocking',
                'description': 'Pliure ou déformation'
            },
            {
                'name': 'Tache',
                'severity': 'threshold',
                'threshold_value': 5,
                'description': 'Salissure ou contamination'
            },
            {
                'name': 'Déchirure',
                'severity': 'blocking',
                'description': 'Déchirement du matériau'
            },
            {
                'name': 'Corps étranger',
                'severity': 'blocking',
                'description': 'Présence de matière étrangère'
            },
            {
                'name': 'Surépaisseur',
                'severity': 'non_blocking',
                'description': 'Zone trop épaisse'
            },
            {
                'name': 'Défaut de tension',
                'severity': 'non_blocking',
                'description': 'Tension incorrecte du matériau'
            },
            {
                'name': 'Défaut de couleur',
                'severity': 'threshold',
                'threshold_value': 3,
                'description': 'Variation de couleur non conforme'
            },
        ]
        
        if self.clear and not self.dry_run:
            QualityDefectType.objects.all().delete()
        
        for data in defect_types:
            if self.dry_run:
                exists = QualityDefectType.objects.filter(name=data['name']).exists()
                if not exists:
                    self.stdout.write(f"  Créerait QualityDefectType: {data['name']}")
                    self.stats['defect_types']['created'] += 1
                else:
                    self.stats['defect_types']['skipped'] += 1
            else:
                obj, created = QualityDefectType.objects.get_or_create(
                    name=data['name'],
                    defaults=data
                )
                if created:
                    self.stdout.write(f"  ✓ Créé QualityDefectType: {obj.name}")
                    self.stats['defect_types']['created'] += 1
                else:
                    self.stats['defect_types']['skipped'] += 1

    def load_spec_items(self):
        """Charge les items de spécifications."""
        spec_items = [
            {
                'name': 'thickness',
                'display_name': 'Épaisseur',
                'unit': 'mm',
                'description': 'Épaisseur du produit',
                'order': 1
            },
            {
                'name': 'micronaire',
                'display_name': 'Micronaire',
                'unit': '',
                'description': 'Indice de finesse des fibres',
                'order': 2
            },
            {
                'name': 'surface_mass',
                'display_name': 'Grammage',
                'unit': 'g/m²',
                'description': 'Masse surfacique',
                'order': 3
            },
            {
                'name': 'resistance',
                'display_name': 'Résistance',
                'unit': 'cN/tex',
                'description': 'Résistance à la traction',
                'order': 4
            },
            {
                'name': 'elongation',
                'display_name': 'Allongement',
                'unit': '%',
                'description': 'Allongement à la rupture',
                'order': 5
            },
        ]
        
        if self.clear and not self.dry_run:
            SpecItem.objects.all().delete()
        
        for data in spec_items:
            if self.dry_run:
                exists = SpecItem.objects.filter(name=data['name']).exists()
                if not exists:
                    self.stdout.write(f"  Créerait SpecItem: {data['display_name']}")
                    self.stats['spec_items']['created'] += 1
                else:
                    self.stats['spec_items']['skipped'] += 1
            else:
                obj, created = SpecItem.objects.get_or_create(
                    name=data['name'],
                    defaults=data
                )
                if created:
                    self.stdout.write(f"  ✓ Créé SpecItem: {obj.display_name}")
                    self.stats['spec_items']['created'] += 1
                else:
                    self.stats['spec_items']['skipped'] += 1

    def load_param_items(self):
        """Charge les items de paramètres machine."""
        param_items = [
            # Fibrage - Températures
            {
                'name': 'temp_cylinder_1',
                'display_name': 'Température Cylindre 1',
                'category': 'fibrage',
                'unit': '°C',
                'default_value': 180.0,
                'min_value': 150.0,
                'max_value': 250.0,
                'order': 1
            },
            {
                'name': 'temp_cylinder_2',
                'display_name': 'Température Cylindre 2',
                'category': 'fibrage',
                'unit': '°C',
                'default_value': 185.0,
                'min_value': 150.0,
                'max_value': 250.0,
                'order': 2
            },
            {
                'name': 'temp_cylinder_3',
                'display_name': 'Température Cylindre 3',
                'category': 'fibrage',
                'unit': '°C',
                'default_value': 190.0,
                'min_value': 150.0,
                'max_value': 250.0,
                'order': 3
            },
            {
                'name': 'temp_cylinder_4',
                'display_name': 'Température Cylindre 4',
                'category': 'fibrage',
                'unit': '°C',
                'default_value': 195.0,
                'min_value': 150.0,
                'max_value': 250.0,
                'order': 4
            },
            # Fibrage - Vitesses
            {
                'name': 'line_speed',
                'display_name': 'Vitesse Ligne',
                'category': 'fibrage',
                'unit': 'm/min',
                'default_value': 25.0,
                'min_value': 10.0,
                'max_value': 50.0,
                'order': 5
            },
            # Ensimeuse
            {
                'name': 'winder_speed',
                'display_name': 'Vitesse Enrouleur',
                'category': 'ensimeuse',
                'unit': 'm/min',
                'default_value': 25.0,
                'min_value': 10.0,
                'max_value': 50.0,
                'order': 6
            },
            {
                'name': 'winder_pressure',
                'display_name': 'Pression Enrouleur',
                'category': 'ensimeuse',
                'unit': 'bar',
                'default_value': 3.0,
                'min_value': 1.0,
                'max_value': 10.0,
                'order': 7
            },
        ]
        
        if self.clear and not self.dry_run:
            ParamItem.objects.all().delete()
        
        for data in param_items:
            if self.dry_run:
                exists = ParamItem.objects.filter(name=data['name']).exists()
                if not exists:
                    self.stdout.write(f"  Créerait ParamItem: {data['display_name']}")
                    self.stats['param_items']['created'] += 1
                else:
                    self.stats['param_items']['skipped'] += 1
            else:
                obj, created = ParamItem.objects.get_or_create(
                    name=data['name'],
                    defaults=data
                )
                if created:
                    self.stdout.write(f"  ✓ Créé ParamItem: {obj.display_name}")
                    self.stats['param_items']['created'] += 1
                else:
                    self.stats['param_items']['skipped'] += 1


    def load_profiles(self):
        """Charge les profils (templates) produits."""
        profiles = [
            {
                'name': 'STANDARD 15MM',
                'description': 'Profil standard pour production 15mm',
                'belt_speed_m_per_minute': 25.0,
                'oee_target_percentage': 85.0,
                'min_thickness': 14.0,
                'max_thickness': 16.0,
                'target_thickness': 15.0,
                'micronaire_min': 3.8,
                'micronaire_max': 4.2,
                'micronaire_target': 4.0,
                'weight_min': 480.0,
                'weight_max': 520.0,
                'weight_target': 500.0,
            },
            {
                'name': 'PREMIUM 20MM',
                'description': 'Profil premium haute qualité',
                'belt_speed_m_per_minute': 20.0,
                'oee_target_percentage': 80.0,
                'min_thickness': 19.0,
                'max_thickness': 21.0,
                'target_thickness': 20.0,
                'micronaire_min': 3.6,
                'micronaire_max': 4.0,
                'micronaire_target': 3.8,
                'weight_min': 580.0,
                'weight_max': 620.0,
                'weight_target': 600.0,
            },
            {
                'name': 'ECO 12MM',
                'description': 'Profil économique',
                'belt_speed_m_per_minute': 30.0,
                'oee_target_percentage': 90.0,
                'min_thickness': 11.5,
                'max_thickness': 12.5,
                'target_thickness': 12.0,
                'micronaire_min': 4.0,
                'micronaire_max': 4.4,
                'micronaire_target': 4.2,
                'weight_min': 380.0,
                'weight_max': 420.0,
                'weight_target': 400.0,
            },
        ]
        
        if self.clear and not self.dry_run:
            ProfileTemplate.objects.all().delete()
        
        for data in profiles:
            if self.dry_run:
                exists = ProfileTemplate.objects.filter(name=data['name']).exists()
                if not exists:
                    self.stdout.write(f"  Créerait ProfileTemplate: {data['name']}")
                    self.stats['profiles']['created'] += 1
                else:
                    self.stats['profiles']['skipped'] += 1
            else:
                obj, created = ProfileTemplate.objects.get_or_create(
                    name=data['name'],
                    defaults=data
                )
                if created:
                    self.stdout.write(f"  ✓ Créé ProfileTemplate: {obj.name}")
                    self.stats['profiles']['created'] += 1
                    
                    # Associer les spec items et param items si ils existent
                    # Les ProfileTemplate ont des ManyToMany vers spec_items et param_items
                    spec_items = SpecItem.objects.filter(is_active=True)
                    param_items = ParamItem.objects.filter(is_active=True)
                    
                    if spec_items.exists():
                        obj.spec_items.set(spec_items)
                    if param_items.exists():
                        obj.param_items.set(param_items)
                else:
                    self.stats['profiles']['skipped'] += 1

    def load_lost_time_reasons(self):
        """Charge les motifs de temps perdu WCM."""
        reasons = [
            # Changements
            {'name': 'Changement OF', 'category': 'changement', 'color': '#FF9800', 'is_planned': True},
            {'name': 'Changement produit', 'category': 'changement', 'color': '#FF9800', 'is_planned': True},
            {'name': 'Changement bobine', 'category': 'changement', 'color': '#FF9800', 'is_planned': False},
            
            # Pannes
            {'name': 'Panne mécanique', 'category': 'panne', 'color': '#F44336', 'is_planned': False},
            {'name': 'Panne électrique', 'category': 'panne', 'color': '#F44336', 'is_planned': False},
            {'name': 'Panne informatique', 'category': 'panne', 'color': '#F44336', 'is_planned': False},
            
            # Qualité
            {'name': 'Défaut qualité', 'category': 'qualite', 'color': '#9C27B0', 'is_planned': False},
            {'name': 'Contrôle qualité', 'category': 'qualite', 'color': '#9C27B0', 'is_planned': True},
            {'name': 'Réglage qualité', 'category': 'qualite', 'color': '#9C27B0', 'is_planned': False},
            
            # Organisation
            {'name': 'Attente matière', 'category': 'organisation', 'color': '#2196F3', 'is_planned': False},
            {'name': 'Attente opérateur', 'category': 'organisation', 'color': '#2196F3', 'is_planned': False},
            {'name': 'Attente maintenance', 'category': 'organisation', 'color': '#2196F3', 'is_planned': False},
            
            # Maintenance
            {'name': 'Maintenance préventive', 'category': 'maintenance', 'color': '#4CAF50', 'is_planned': True},
            {'name': 'Nettoyage', 'category': 'maintenance', 'color': '#4CAF50', 'is_planned': True},
            {'name': 'Graissage', 'category': 'maintenance', 'color': '#4CAF50', 'is_planned': True},
            
            # Autres
            {'name': 'Pause réglementaire', 'category': 'autre', 'color': '#607D8B', 'is_planned': True},
            {'name': 'Formation', 'category': 'autre', 'color': '#607D8B', 'is_planned': True},
            {'name': 'Essai', 'category': 'autre', 'color': '#607D8B', 'is_planned': False},
        ]
        
        if self.clear and not self.dry_run:
            WcmLostTimeReason.objects.all().delete()
        
        for i, data in enumerate(reasons):
            data['order'] = i + 1
            
            if self.dry_run:
                exists = WcmLostTimeReason.objects.filter(name=data['name']).exists()
                if not exists:
                    self.stdout.write(f"  Créerait WcmLostTimeReason: {data['name']}")
                    self.stats['lost_time_reasons']['created'] += 1
                else:
                    self.stats['lost_time_reasons']['skipped'] += 1
            else:
                obj, created = WcmLostTimeReason.objects.get_or_create(
                    name=data['name'],
                    defaults=data
                )
                if created:
                    self.stdout.write(f"  ✓ Créé WcmLostTimeReason: {obj.name}")
                    self.stats['lost_time_reasons']['created'] += 1
                else:
                    self.stats['lost_time_reasons']['skipped'] += 1

    def load_checklist_items(self):
        """Charge les items de checklist WCM."""
        # D'abord créer le template par défaut
        if not self.dry_run:
            template, _ = WcmChecklistTemplate.objects.get_or_create(
                name='Template Standard',
                defaults={
                    'description': 'Template de checklist standard pour tous les profils',
                    'is_default': True,
                    'is_active': True
                }
            )
        
        items = [
            # Sécurité
            {'category': 'securite', 'text': 'Port des EPI conforme', 'order': 1},
            {'category': 'securite', 'text': 'Zone de travail sécurisée', 'order': 2},
            {'category': 'securite', 'text': 'Arrêts d\'urgence fonctionnels', 'order': 3},
            
            # Machine
            {'category': 'machine', 'text': 'Températures dans les tolérances', 'order': 4},
            {'category': 'machine', 'text': 'Pressions correctes', 'order': 5},
            {'category': 'machine', 'text': 'Vitesses réglées', 'order': 6},
            {'category': 'machine', 'text': 'Pas de fuite hydraulique', 'order': 7},
            {'category': 'machine', 'text': 'Niveau d\'huile correct', 'order': 8},
            
            # Produit
            {'category': 'produit', 'text': 'Matière première conforme', 'order': 9},
            {'category': 'produit', 'text': 'Aspect visuel correct', 'order': 10},
            {'category': 'produit', 'text': 'Dimensions respectées', 'order': 11},
            
            # Propreté
            {'category': 'proprete', 'text': 'Machine propre', 'order': 12},
            {'category': 'proprete', 'text': 'Sol propre et dégagé', 'order': 13},
            {'category': 'proprete', 'text': 'Bacs de déchets vidés', 'order': 14},
            
            # Documentation
            {'category': 'documentation', 'text': 'OF disponible et à jour', 'order': 15},
            {'category': 'documentation', 'text': 'Fiches de contrôle remplies', 'order': 16},
            {'category': 'documentation', 'text': 'Consignes affichées', 'order': 17},
        ]
        
        if self.clear and not self.dry_run:
            WcmChecklistItem.objects.all().delete()
        
        for data in items:
            if self.dry_run:
                self.stdout.write(f"  Créerait WcmChecklistItem: {data['text']}")
                self.stats['checklist_items']['created'] += 1
            else:
                obj, created = WcmChecklistItem.objects.get_or_create(
                    text=data['text'],
                    defaults={
                        'category': data['category'],
                        'is_active': True
                    }
                )
                if created:
                    self.stdout.write(f"  ✓ Créé WcmChecklistItem: {obj.text}")
                    self.stats['checklist_items']['created'] += 1
                    # Associer au template
                    template.items.add(obj)
                else:
                    self.stats['checklist_items']['skipped'] += 1

    def load_operators(self):
        """Charge les opérateurs."""
        operators = [
            {'first_name': 'Jean', 'last_name': 'DUPONT', 'is_active': True},
            {'first_name': 'Marie', 'last_name': 'MARTIN', 'is_active': True},
            {'first_name': 'Pierre', 'last_name': 'BERNARD', 'is_active': True},
            {'first_name': 'Sophie', 'last_name': 'THOMAS', 'is_active': True},
            {'first_name': 'Michel', 'last_name': 'ROBERT', 'is_active': True},
            {'first_name': 'Nathalie', 'last_name': 'RICHARD', 'is_active': True},
            {'first_name': 'Alain', 'last_name': 'PETIT', 'is_active': False},
            {'first_name': 'Isabelle', 'last_name': 'DURAND', 'is_active': True},
        ]
        
        if self.clear and not self.dry_run:
            Operator.objects.all().delete()
        
        for data in operators:
            if self.dry_run:
                # L'employee_id sera généré automatiquement
                employee_id = f"{data['first_name']}{data['last_name'].upper()}"
                exists = Operator.objects.filter(employee_id=employee_id).exists()
                if not exists:
                    self.stdout.write(f"  Créerait Operator: {data['first_name']} {data['last_name']}")
                    self.stats['operators']['created'] += 1
                else:
                    self.stats['operators']['skipped'] += 1
            else:
                # L'employee_id est généré automatiquement par le modèle
                employee_id = f"{data['first_name']}{data['last_name'].upper()}"
                obj, created = Operator.objects.get_or_create(
                    employee_id=employee_id,
                    defaults=data
                )
                if created:
                    self.stdout.write(f"  ✓ Créé Operator: {obj.full_name} ({obj.employee_id})")
                    self.stats['operators']['created'] += 1
                else:
                    self.stats['operators']['skipped'] += 1

    def load_modes(self):
        """Charge les modes de fonctionnement."""
        modes = [
            {
                'name': 'Normal',
                'description': 'Mode de fonctionnement normal',
                'is_enabled': True,
                'is_active': True
            },
            {
                'name': 'Permissif',
                'description': 'Mode permissif - Autorise certains écarts',
                'is_enabled': False,
                'is_active': True
            },
            {
                'name': 'Dégradé',
                'description': 'Mode dégradé - Fonctionnement limité',
                'is_enabled': False,
                'is_active': True
            },
            {
                'name': 'Maintenance',
                'description': 'Mode maintenance - Pour les interventions',
                'is_enabled': False,
                'is_active': True
            },
        ]
        
        if self.clear and not self.dry_run:
            Mode.objects.all().delete()
        
        for data in modes:
            if self.dry_run:
                exists = Mode.objects.filter(name=data['name']).exists()
                if not exists:
                    self.stdout.write(f"  Créerait Mode: {data['name']}")
                    self.stats['modes']['created'] += 1
                else:
                    self.stats['modes']['skipped'] += 1
            else:
                obj, created = Mode.objects.get_or_create(
                    name=data['name'],
                    defaults=data
                )
                if created:
                    self.stdout.write(f"  ✓ Créé Mode: {obj.name}")
                    self.stats['modes']['created'] += 1
                else:
                    self.stats['modes']['skipped'] += 1

    def load_mood_counters(self):
        """Initialise les compteurs d'humeur."""
        moods = ['happy', 'neutral', 'unhappy', 'no_response']
        
        if self.clear and not self.dry_run:
            MoodCounter.objects.all().delete()
        
        for mood in moods:
            if self.dry_run:
                exists = MoodCounter.objects.filter(mood_type=mood).exists()
                if not exists:
                    self.stdout.write(f"  Créerait MoodCounter: {mood}")
                    self.stats['mood_counters']['created'] += 1
                else:
                    self.stats['mood_counters']['skipped'] += 1
            else:
                obj, created = MoodCounter.objects.get_or_create(
                    mood_type=mood,
                    defaults={'count': 0}
                )
                if created:
                    self.stdout.write(f"  ✓ Créé MoodCounter: {obj.get_mood_type_display()}")
                    self.stats['mood_counters']['created'] += 1
                else:
                    self.stats['mood_counters']['skipped'] += 1