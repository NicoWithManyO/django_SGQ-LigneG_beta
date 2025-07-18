# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Vue d'ensemble du projet

**SGQ Ligne G** est un système de gestion de production industrielle conforme aux normes ISO 9001, ISO 14001 et ISO 45001. Il gère la production avec traçabilité complète.

## Architecture du projet

### Structure des applications Django

```
django_SGQ-LigneG_beta/
├── catalog/        # Modèles de référence (types, templates)
├── production/     # Gestion des postes et rouleaux
├── quality/        # Contrôles qualité et défauts
├── wcm/           # World Class Manufacturing (temps perdus, check-lists)
├── planification/ # Opérateurs et ordres de fabrication
├── livesession/   # Gestion de l'état actuel (session + CurrentProfile)
└── frontend/      # Templates et composants UI
    ├── static/
    │   ├── css/   # Architecture CSS modulaire
    │   │   ├── base.css         # Styles de base
    │   │   ├── components.css   # Composants réutilisables
    │   │   ├── layout.css       # Structure de page
    │   │   └── fiche-poste.css  # Styles spécifiques
    │   └── js/
    │       └── fiche-poste.js   # Composant Alpine.js isolé
    └── templates/
        └── frontend/
            ├── components/      # Composants réutilisables
            └── pages/          # Pages complètes
```

### Dossier de référence AIDE

Le dossier `/home/nico/claude/django_SGQ-LigneG_beta/AIDE/` contient une version de référence du projet. **ATTENTION** : Ne pas modifier les fichiers dans ce dossier - c'est uniquement pour consultation.

## Commandes courantes

```bash
# Environnement virtuel
source .venv/bin/activate  # Note: .venv pas venv

# Migrations
python manage.py makemigrations
python manage.py migrate

# Serveur de développement
python manage.py runserver

# Shell Django pour debug
python manage.py shell

# Création superuser
python manage.py createsuperuser

# Tests (à implémenter)
python manage.py test

# Vérifier les dépendances installées
pip freeze | grep -i django
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
   
2. **API Session** : `/api/session/` (PATCH) pour mettre à jour tous les champs de session
   - Gère operator_id, shift_date, vacation, profile_id, etc.
   - Met à jour CurrentProfile et la session Django
   - Sérialise automatiquement les dates/heures pour le stockage

3. **Système de mise à jour dynamique** :
   - Alpine.js pour l'état local réactif
   - Sauvegarde automatique via watchers
   - Pas de rechargement de page nécessaire

### Pattern Frontend Alpine.js

#### Structure modulaire des composants
```javascript
// Dans un fichier JS séparé (ex: fiche-poste.js)
function fichePoste() {
    return {
        // État
        operatorId: '',
        shiftDate: '',
        vacation: '',
        
        // Initialisation
        init() {
            this.loadFromSession();
            this.$watch(['operatorId', 'shiftDate', 'vacation'], () => {
                this.saveToSession();
            });
        },
        
        // Méthodes
        async saveToSession() {
            // API call avec gestion CSRF
        }
    };
}
```

#### Template HTML avec composant isolé
```html
<!-- Dans templates/frontend/components/fiche-poste.html -->
<div class="accordion-body" x-data="fichePoste()" x-init="init()">
    <!-- Structure HTML pure, pas de logique -->
</div>

<!-- Dans la page principale -->
{% include 'frontend/components/fiche-poste.html' %}
```

#### Passage des données Django vers Alpine.js
```html
<script>
// Données globales depuis Django
window.sessionData = {{ session_data|safe }};
</script>
<script src="{% static 'frontend/js/fiche-poste.js' %}"></script>
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

### Frontend : Architecture et Patterns

**Stack technique** :
- Bootstrap 5.3 pour le styling de base
- Alpine.js 3.x pour la réactivité (pas de build nécessaire)
- Django templates avec includes pour les composants
- Pas de framework JavaScript lourd (React, Vue, etc.)
- HTMX disponible mais pas encore utilisé

**Architecture CSS modulaire** :
```css
/* base.css - Fondation */
- Reset et styles globaux
- Variables CSS (couleurs: #215c98, #9da1a8, #dae9f8)
- Typographie de base

/* components.css - Composants globaux */
- Accordéons Bootstrap customisés
- Tables centrées
- Badges et boutons

/* layout.css - Structure */
- Grille 3 colonnes (3-6-3 ou personnalisable)
- Responsive design
- Espacements standards

/* [feature].css - Styles spécifiques */
- Ex: fiche-poste.css pour la fiche de poste
```

**Pattern de composant réutilisable** :
1. Template HTML isolé dans `components/`
2. JavaScript Alpine.js dans fichier séparé
3. CSS spécifique si nécessaire
4. Include Django pour l'utilisation

**Conventions de nommage** :
- Templates : kebab-case (`fiche-poste.html`)
- Composants JS : camelCase (`fichePoste()`)
- Classes CSS : kebab-case avec préfixes (`.form-row`, `.shift-id-status`)
- IDs HTML : kebab-case (`operator-select`)

## Patterns d'architecture spécifiques

### Pattern "Catalog + Through Tables"
Le projet utilise un pattern sophistiqué pour gérer les configurations :
```python
# Catalogue (définit les types disponibles)
class SpecItem(models.Model):
    name = models.CharField(max_length=100)
    # Métadonnées uniquement

# Table intermédiaire (stocke les valeurs)
class ProfileSpecValue(models.Model):
    profile = models.ForeignKey(ProfileTemplate)
    spec_item = models.ForeignKey(SpecItem)
    min_value = models.DecimalField()
    nominal_value = models.DecimalField()
    max_value = models.DecimalField()
    # Valeurs réelles
```

### Génération automatique des IDs (critique)
Les IDs sont générés automatiquement dans la méthode save() des modèles :
```python
# Shift ID : JJMMAA_PrenomNom_Vacation
def save(self):
    if not self.shift_id:
        date_str = self.date.strftime('%d%m%y')
        operator_name = f"{self.operator.first_name}{self.operator.last_name}"
        self.shift_id = f"{date_str}_{operator_name}_{self.vacation}"
```

### Session-based workflow
1. Les rouleaux sont créés avec `session_key` avant assignation à un poste
2. L'état actuel (profil, opérateur) est maintenu via Django sessions
3. L'API `/api/session/` synchronise frontend et backend

## UI/UX Patterns

### Accordéons Bootstrap customisés
- Headers bleus (#215c98) avec texte blanc
- Body en fond gris clair (#f8f9fa)
- Tous ouverts par défaut (`collapse show`)
- Icônes Bootstrap Icons intégrées

### Formulaires
- **Champs vides affichent "--"** (convention utilisateur)
- Labels sans font-weight (normal)
- Champs avec fond bleu clair (#dae9f8) et bordure bleue
- Select avec options vides : `<option value="">--</option>`

### Layout responsive
- Grille principale : 3-6-3 sur desktop
- Colonnes s'empilent sur mobile (`col-lg-*`)
- Scrollbar toujours visible : `body { overflow-y: scroll; }`

## Mémoires de développement

- **Un champ vide doit afficher --**
- **Les IDs auto-générés ne doivent JAMAIS être modifiés**
- **Toujours utiliser des includes pour les composants réutilisables**
- **Pas de styles inline dans le HTML final**
- **Commentaires en français dans le code**
- **Ne jamais créer de fichiers de documentation non demandés**