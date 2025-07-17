# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Vue d'ensemble du projet

**SGQ Ligne G** est un système de gestion de production pour Saint-Gobain Quartz SAS - Nemours, conforme aux normes ISO 9001, ISO 14001 et ISO 45001. Il gère la production de feutre avec traçabilité complète.

## Architecture du projet

### Structure des applications Django

```
django_SGQ-LigneG_beta/
├── catalog/        # Modèles de référence (types, templates)
├── production/     # Gestion des postes et rouleaux
├── quality/        # Contrôles qualité et défauts
├── wcm/           # World Class Manufacturing (temps perdus, check-lists)
├── planification/ # Opérateurs et ordres de fabrication
└── frontend/      # Templates et composants UI
```

### Dossier de référence AIDE

Le dossier `/home/nico/claude/django_SGQ-LigneG_beta/AIDE/` contient une version de référence du projet. **ATTENTION** : Ne pas modifier les fichiers dans ce dossier - c'est uniquement pour consultation.

## Commandes courantes

```bash
# Environnement virtuel
source venv/bin/activate

# Migrations
python manage.py makemigrations
python manage.py migrate

# Serveur de développement
python manage.py runserver

# Tests (à implémenter)
python manage.py test

# Création superuser
python manage.py createsuperuser
```

## Architecture des modèles (après refactoring récent)

### Nouveau système de Profils/Spécifications/Paramètres

Le système a été récemment simplifié pour suivre le pattern "catalogue + valeurs" similaire aux check-lists :

#### Catalogues (dans catalog/models.py)

1. **SpecItem** : Catalogue des types de spécifications
   - Contient uniquement les noms et métadonnées des specs
   - Ex: épaisseur, micronnaire, masse surfacique

2. **ParamItem** : Catalogue des types de paramètres machine
   - Contient uniquement les noms et métadonnées des paramètres
   - Ex: oxygène primaire, vitesse tapis

3. **ProfileTemplate** : Profils de production (ex: 80g/m², 40g/m²)
   - Utilise des tables intermédiaires pour stocker les valeurs

#### Tables intermédiaires (stockage des valeurs)

1. **ProfileSpecValue** : Valeurs de spécifications pour un profil
   - Stocke min, min_alert, nominal, max_alert, max, max_nok, is_blocking
   - Relation unique entre ProfileTemplate et SpecItem

2. **ProfileParamValue** : Valeurs de paramètres pour un profil
   - Stocke une valeur simple pour chaque paramètre
   - Relation unique entre ProfileTemplate et ParamItem

### Autres modèles importants

- **Operator** (planification) : Opérateurs avec ID auto-généré `PrenomNOM`
- **FabricationOrder** (planification) : Ordres de fabrication
- **Shift** (production) : Postes avec ID `JJMMAA_PrenomNom_Vacation`
- **Roll** (production) : Rouleaux avec ID `OF_NumRouleau`
- **QualityDefectType** (catalog) : Types de défauts qualité
- **WcmChecklistTemplate/Item** (catalog) : Templates de check-lists
- **WcmLostTimeReason** (catalog) : Motifs de temps perdu

## Points d'attention

### Migrations récentes

Le projet a subi un refactoring majeur des modèles Profile/Specification/Parameter. Les anciens modèles suivants ont été supprimés :
- WcmProfile, WcmProfileSpec, WcmProfileMachineParam
- SpecType, ParamType
- MachineParametersHistory

### Conventions importantes

1. **Ne jamais créer de fichiers** sauf si explicitement demandé
2. **Toujours préférer éditer** des fichiers existants
3. **Pas de fichiers de documentation** (*.md, README) sauf si demandé
4. **Commentaires en français** dans le code
5. **IDs auto-générés** : Ne pas modifier la logique de génération

### Pattern d'architecture

Le projet suit le pattern "catalogue + valeurs" :
- Les catalogues (SpecItem, ParamItem) définissent les types disponibles
- Les valeurs sont stockées dans des tables intermédiaires liées aux entités principales
- Similaire au système ChecklistTemplate/ChecklistItem/ChecklistResponse

### Interface Admin

L'admin Django utilise des inlines pour gérer les valeurs dans ProfileTemplate :
- ProfileSpecValueInline : Gestion des valeurs de spécifications
- ProfileParamValueInline : Gestion des valeurs de paramètres

## Technologies utilisées

- **Backend** : Django 5.2.4, Python 3.11+, DRF 3.15.2
- **Frontend** : Bootstrap 5.3, HTMX 2.0, JavaScript vanilla
- **Base de données** : SQLite (dev), PostgreSQL recommandé (prod)
- **API** : Django REST Framework avec endpoint `/livesession/api/current-session/`

## Contexte métier

- **Vacations** : Matin (4h-12h), ApresMidi (12h-20h), Nuit (20h-4h), Journée (7h30-15h30)
- **Unités** : mètres (m), grammes (g), minutes (min)
- **Statuts rouleaux** : CONFORME/NON_CONFORME
- **Destinations** : PRODUCTION/DECOUPE/DECHETS

## Ressources

- README principal : `/home/nico/claude/django_SGQ-LigneG_beta/README.md`
- README de référence : `/home/nico/claude/django_SGQ-LigneG_beta/AIDE/README.md`
- Requirements : Django==5.2.4, djangorestframework==3.15.2, django-htmx==1.23.2

## Gestion des sessions et profils actuels

### Architecture LiveSession

Le projet utilise une application `livesession` pour gérer l'état actuel de production :

1. **CurrentProfile** : Modèle singleton qui stocke le profil actif
   - Source de vérité unique pour le profil en cours
   - Synchronisé avec la session Django
   
2. **API Session** : `/api/session/` (PATCH) pour mettre à jour le profil
   - Accepte `profile_id` (peut être null)
   - Met à jour CurrentProfile et la session Django

3. **Système de mise à jour dynamique** :
   - Les pages utilisent Alpine.js pour les interactions réactives
   - Les changements de profil peuvent recharger la page ou utiliser HTMX/fetch pour des mises à jour partielles

### Patterns d'implémentation courants

#### Sélecteur de profil avec mise à jour dynamique
```javascript
x-data="{
    profileId: {{ current_profile.id|default:'null' }},
    async saveProfile() {
        const response = await fetch('/api/session/', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': '{{ csrf_token }}'
            },
            body: JSON.stringify({ profile_id: this.profileId || null })
        });
        if (response.ok) {
            // Option 1: Recharger la page
            window.location.reload();
            // Option 2: Mise à jour partielle avec HTMX
            // htmx.ajax('GET', '/partial/profile-details/', {target: '#profile-details'});
        }
    }
}"
```

## Commandes de lint et tests

```bash
# Tests unitaires (lorsque implémentés)
python manage.py test

# Vérification du code Python
# Note: Pas de linter configuré actuellement
# Recommandé: ruff, flake8 ou pylint

# Vérification des types (si mypy est configuré)
# mypy .
```

## Points d'attention spécifiques

### IDs auto-générés - Ne jamais modifier

Les logiques de génération d'IDs suivantes sont critiques et ne doivent pas être modifiées :
- **Operator.employee_id** : `PrenomNOM` généré dans save()
- **Shift.shift_id** : `JJMMAA_PrenomNom_Vacation` généré dans save()
- **Roll.roll_id** : `OF_NumRouleau` ou `ROLL_YYYYMMDD_HHMMSS` généré dans save()

### Validation métier dans les serializers

Toute logique complexe doit être dans les serializers, pas dans les modèles :
- Calculs (TRS, grammage, pourcentages)
- Validations croisées (ex: rouleau non conforme → pas de destination PRODUCTION)
- Transformations de données

### Frontend : Alpine.js + HTMX

Le projet utilise une combinaison d'Alpine.js et HTMX :
- Alpine.js pour l'état local et les interactions simples
- HTMX pour les mises à jour partielles du DOM
- Bootstrap 5.3 pour le styling
- Pas de framework JavaScript lourd (React, Vue, etc.)