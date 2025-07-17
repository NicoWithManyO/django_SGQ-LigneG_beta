# SGQ Ligne G - Système de Gestion de Qualité

## Vue d'ensemble

SGQ Ligne G est un système de gestion de production pour Saint-Gobain Quartz SAS - Nemours, conforme aux normes ISO 9001, ISO 14001 et ISO 45001. Il gère la production de feutre avec traçabilité complète et interface temps réel.

## Stack Technique

- **Backend** : Django 5.2.4, Python 3.11+
- **API** : Django REST Framework 3.15.2
- **Frontend** : Alpine.js 3.x, Bootstrap 5.3
- **Base de données** : SQLite (dev), PostgreSQL (prod)
- **Temps réel** : Sessions Django + API REST

## Architecture du Projet

### Structure des Applications

```
django_SGQ-LigneG_beta/
├── catalog/                # Modèles de référence centralisés
│   ├── models.py          # Tous les modèles support préfixés
│   └── ...
├── production/             # Gestion de la production
│   ├── models.py          # Shift, Roll
│   └── ...
├── quality/                # Gestion de la qualité
│   ├── models.py          # RollDefect, RollThickness, Controls
│   └── ...
├── wcm/                    # World Class Manufacturing
│   ├── models.py          # Mode, MoodCounter, LostTimeEntry, etc.
│   └── ...
├── planification/          # Planification de production
│   ├── models.py          # Operator, FabricationOrder
│   └── ...
└── ...
```

### Répartition des Modèles

#### CATALOG (Modèles de référence)
- **QualityDefectType** : Types de défauts avec criticité
- **WcmChecklistTemplate** : Templates de check-lists
- **WcmChecklistItem** : Items de check-list
- **WcmLostTimeReason** : Motifs de temps perdu
- **WcmProfile** : Profils de production (80g/m², 40g/m²)
- **WcmProfileSpec** : Spécifications d'un profil (micronnaire, épaisseur, etc.)
- **WcmProfileMachineParam** : Paramètres machine d'un profil

#### PRODUCTION
- **Shift** : Postes de travail (matin, après-midi, nuit)
- **Roll** : Rouleaux produits

#### QUALITY
- **RollDefect** : Défauts constatés sur les rouleaux
- **RollThickness** : Mesures d'épaisseur
- **Controls** : Contrôles qualité (micronnaire, extrait sec, masses surfaciques)

#### WCM
- **Mode** : Modes de fonctionnement (permissif, maintenance)
- **MoodCounter** : Compteur d'humeur anonyme
- **LostTimeEntry** : Entrées de temps d'arrêt
- **MachineParametersHistory** : Historique des modifications paramètres
- **ChecklistResponse** : Réponses aux check-lists

#### PLANIFICATION
- **Operator** : Opérateurs de production
- **FabricationOrder** : Ordres de fabrication

## Conventions de Développement

### Conventions de Nommage

#### Modèles Django
- Noms en **PascalCase** : `Shift`, `Roll`, `RollDefect`
- Champs en **snake_case** : `created_at`, `thickness_value`, `is_active`
- Relations : nom du modèle en minuscule : `shift`, `roll`, `defect_type`
- Verbose names en français dans les modèles

#### Base de Données
- Tables : nom du modèle au pluriel en snake_case
- Colonnes : snake_case
- Index : préfixe `idx_`
- Foreign keys : préfixe `fk_`
- Unique constraints : préfixe `uk_`

#### Code Python
- Variables : **snake_case**
- Fonctions : **snake_case**
- Constantes : **UPPER_CASE**
- Classes : **PascalCase**

### Conventions Business

#### Identifiants Uniques
- **Operator** : `PrenomNOM` (ex: `JeanDUPONT`) - Généré automatiquement
- **Shift** : `JJMMAA_PrenomNom_Vacation` (ex: `161225_JeanDupont_Matin`) - Généré automatiquement
- **Roll** : `OF_NumRouleau` (ex: `OF12345_001`) ou `ROLL_YYYYMMDD_HHMMSS` si pas d'OF - Généré automatiquement

#### Unités de Mesure
- Épaisseur : millimètres (mm) avec 2 décimales
- Longueur : mètres (m) avec 2 décimales
- Masse : grammes (g) avec 2 décimales
- Grammage : g/m avec 1 décimale

#### Statuts et Choix
- Utiliser des constantes en MAJUSCULES dans le code
- Utiliser des tuples de choix dans les modèles
- Les valeurs stockées en base sont en anglais
- Les labels affichés sont en français

### Architecture et Patterns

#### Séparation des Responsabilités

**Modèles (models.py)** - Structure de données pure :
- Définition des champs et relations
- Contraintes de base de données (unique, null, blank)
- Méthodes `__str__()` pour la représentation
- Génération automatique d'IDs dans `save()` si nécessaire
- PAS de validation métier complexe
- PAS de calculs ou propriétés calculées

**Serializers (serializers.py)** - Logique métier :
- Validation des données complexes
- Calculs métier (TRS, moyennes, pourcentages)
- Règles business (ex: rouleau non conforme ne peut pas aller en production)
- Transformations de données

**Signals** - Actions transverses :
- Audit et traçabilité
- Notifications
- Mises à jour automatiques entre modèles

#### Contraintes vs Logique Métier

**Contraintes de données** (dans les modèles) :
- Génération d'IDs uniques : `shift_id`, `roll_id`, `employee_id`
- Formatage basique : uppercase, trim espaces
- Valeurs par défaut simples
- Contraintes d'unicité

**Logique métier** (dans les serializers) :
- Calculs complexes basés sur plusieurs champs
- Validations croisées entre modèles
- Règles business spécifiques
- Vérifications de cohérence

### Style de Code

#### Python
- Respect strict de PEP 8
- Longueur de ligne : 120 caractères max
- Imports groupés : standard library, third-party, local
- Docstrings en français pour les classes et méthodes

#### Commentaires
- **Toujours en français**
- Commentaires utiles et professionnels
- Éviter les commentaires évidents
- Privilégier les docstrings

### Exemples de Code

#### Modèle (Pure Data)

```python
from django.db import models


class Roll(models.Model):
    """Modèle représentant un rouleau de production."""
    
    STATUS_CHOICES = [
        ('CONFORME', 'Conforme'),
        ('NON_CONFORME', 'Non conforme'),
    ]
    
    # Identifiant unique
    roll_id = models.CharField(
        max_length=50, 
        unique=True,
        verbose_name="ID Rouleau",
        help_text="Format: OF_NumRouleau (ex: OF12345_001)"
    )
    
    # Relations
    shift = models.ForeignKey(
        'production.Shift',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='rolls',
        verbose_name="Poste de production"
    )
    
    # Données
    length = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Longueur (m)"
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='CONFORME',
        verbose_name="Statut"
    )
    
    # Métadonnées
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Rouleau"
        verbose_name_plural = "Rouleaux"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.roll_id} - {self.length}m" if self.length else self.roll_id
    
    def save(self, *args, **kwargs):
        """Génère automatiquement le roll_id si non fourni."""
        if not self.roll_id:
            if self.fabrication_order and self.roll_number:
                self.roll_id = f"{self.fabrication_order.order_number}_{self.roll_number:03d}"
            else:
                from datetime import datetime
                now = datetime.now()
                self.roll_id = f"ROLL_{now.strftime('%Y%m%d_%H%M%S')}"
        
        super().save(*args, **kwargs)
```

#### Serializer (Logique Métier)

```python
from rest_framework import serializers
from .models import Roll


class RollSerializer(serializers.ModelSerializer):
    """Serializer pour les rouleaux avec validation métier."""
    
    # Champs calculés
    grammage = serializers.SerializerMethodField()
    
    class Meta:
        model = Roll
        fields = '__all__'
    
    def get_grammage(self, obj):
        """Calcule le grammage du rouleau."""
        if obj.net_mass and obj.length and obj.length > 0:
            return round(float(obj.net_mass) / float(obj.length), 1)
        return 0
    
    def validate(self, data):
        """Validation métier complexe."""
        # Un rouleau non conforme ne peut pas aller en production
        if data.get('status') == 'NON_CONFORME' and data.get('destination') == 'PRODUCTION':
            raise serializers.ValidationError({
                'destination': 'Un rouleau non conforme ne peut pas aller en production'
            })
        
        # Vérifier la cohérence des masses
        total_mass = data.get('total_mass', 0)
        tube_mass = data.get('tube_mass', 0)
        if tube_mass >= total_mass:
            raise serializers.ValidationError({
                'tube_mass': 'La masse du tube doit être inférieure à la masse totale'
            })
        
        return data
```

## Gestion des Dépendances

### Relations entre Applications
- `catalog` : Contient tous les modèles de référence (pas de dépendances)
- `production` dépend de `planification` (Operator, FabricationOrder) et `catalog` (WcmProfile)
- `quality` dépend de `production` (Roll) et `catalog` (QualityDefectType)
- `wcm` dépend de `production`, `planification` et `catalog`
- `planification` dépend de `catalog` (WcmProfile)

### Ordre de Migration
1. `catalog` (pas de dépendances)
2. `planification` (dépend de catalog)
3. `production` (dépend de planification et catalog)
4. `quality` (dépend de production et catalog)
5. `wcm` (dépend de production, planification et catalog)

## Tests

Chaque application doit avoir ses propres tests dans `app_name/tests/`:
- `test_models.py` : Tests des modèles
- `test_views.py` : Tests des vues
- `test_api.py` : Tests des API
- `test_services.py` : Tests des services métier

## Documentation

- Chaque modèle doit avoir une docstring décrivant son rôle
- Chaque méthode complexe doit être documentée
- Les validations métier doivent être expliquées
- Les calculs et formules doivent être détaillés

## Patterns d'Architecture

### 1. Pattern de Données Persistantes

Pour les données avec modèle Django (ex: ProfileTemplate, Operator) :

```python
# models.py - Modèle simple, pas de logique métier
class ProfileTemplate(models.Model):
    name = models.CharField(max_length=100, unique=True)
    # ... autres champs
    
# serializers.py - Toute la logique métier
class ProfileTemplateSerializer(serializers.ModelSerializer):
    def validate(self, data):
        # Validations métier complexes ici
        return data

# views.py - ViewSet standard
class ProfileTemplateViewSet(viewsets.ModelViewSet):
    queryset = ProfileTemplate.objects.filter(is_active=True)
    serializer_class = ProfileTemplateSerializer
```

### 2. Pattern de Données de Session

Pour l'état temporaire (profil actuel, poste en cours) :

```python
# Modèle singleton pour l'état actuel
class CurrentProfile(models.Model):
    profile = models.ForeignKey(ProfileTemplate, ...)
    selected_at = models.DateTimeField(auto_now=True)
    
# API de session
class SessionAPIView(APIView):
    def patch(self, request):
        # Met à jour session + CurrentProfile
        profile_id = request.data.get('profile_id')
        request.session['profile_id'] = profile_id
        CurrentProfile.objects.update_or_create(...)
```

### 3. Pattern Frontend Alpine.js

Structure standard pour les composants réactifs :

```html
<div x-data='{ 
    // État initial depuis Django
    profileId: {{ current_profile.id|default:"null" }},
    allProfiles: {{ profiles_json|safe }},
    
    // Propriété calculée (mise à jour automatique)
    get currentProfile() {
        return this.allProfiles.find(p => p.id == this.profileId);
    },
    
    // Action asynchrone
    async save() {
        const response = await fetch("/api/session/", {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": "{{ csrf_token }}"
            },
            body: JSON.stringify({ profile_id: this.profileId })
        });
    }
}'>
    <!-- Template réactif -->
    <template x-if="currentProfile">
        <h4 x-text="currentProfile.name"></h4>
    </template>
</div>
```

### 4. Pattern d'Optimisation des Requêtes

```python
# Précharger toutes les relations pour éviter les N+1
profiles = ProfileTemplate.objects.prefetch_related(
    Prefetch('profilespecvalue_set', 
             queryset=ProfileSpecValue.objects.select_related('spec_item')),
    Prefetch('profileparamvalue_set', 
             queryset=ProfileParamValue.objects.select_related('param_item'))
)

# Sérialiser pour le frontend
profiles_data = ProfileTemplateSerializer(profiles, many=True).data
context = {
    'profiles_json': json.dumps(profiles_data)
}
```

### 5. Architecture API RESTful

```python
# urls.py
router = DefaultRouter()
router.register(r'profiles', ProfileTemplateViewSet)
router.register(r'operators', OperatorViewSet)
router.register(r'rolls', RollViewSet)

# Actions métier personnalisées
@action(detail=True, methods=['post'])
def mark_as_defective(self, request, pk=None):
    roll = self.get_object()
    # Logique métier spécifique
    return Response({'status': 'marked as defective'})
```

## Flux de Données Type

1. **Chargement initial** :
   - Django charge les données depuis la DB
   - Précharge les relations avec prefetch_related
   - Sérialise en JSON pour Alpine.js
   - Lit la session pour l'état actuel

2. **Interaction utilisateur** :
   - Alpine.js met à jour l'état local (instantané)
   - Appel API asynchrone pour persister
   - Pas de rechargement de page

3. **Persistance** :
   - API REST pour les données métier
   - Session Django pour l'état temporaire
   - Transactions pour la cohérence

## Commandes de Développement

```bash
# Environnement virtuel
source .venv/bin/activate

# Migrations
python manage.py makemigrations
python manage.py migrate

# Serveur de développement
python manage.py runserver

# Créer un superuser
python manage.py createsuperuser

# Shell Django
python manage.py shell

# Tests (à implémenter)
python manage.py test
```

## Installation

1. Cloner le repository
2. Créer l'environnement virtuel : `python -m venv .venv`
3. Activer l'environnement : `source .venv/bin/activate`
4. Installer les dépendances : `pip install django djangorestframework`
5. Appliquer les migrations : `python manage.py migrate`
6. Créer un superuser : `python manage.py createsuperuser`
7. Lancer le serveur : `python manage.py runserver`