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
    │   │   ├── fiche-poste.css  # Styles spécifiques
    │   │   ├── zone-rouleau.css # Styles zone qualité rouleau
    │   │   ├── animations.css   # Bibliothèque d'animations réutilisables
    │   │   └── components/      # Styles de micro-composants
    │   │       └── badges.css   # Styles des badges de validation
    │   └── js/
    │       ├── fiche-poste.js   # Composant Alpine.js isolé
    │       └── rouleau.js       # Composant grille qualité rouleau
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

## Configuration Django

### Settings principaux
- **Langue** : `fr-fr` (français)
- **Timezone** : `Europe/Paris`
- **Static files** : `/static/` (URL) et `/staticfiles/` (root)
- **Media files** : `/media/` (URL et root)
- **Base de données** : SQLite en développement
- **Apps installées** : catalog, planification, wcm, production, quality, livesession, frontend, rest_framework

## API REST Endpoints

### Session API
- **GET/PATCH** `/api/session/` - Gestion de l'état de session actuel
  - Stocke : profile_id, shift_id, operator_id, shift_date, vacation, times, OF, etc.
  - Synchronise avec CurrentProfile et Django sessions

### WCM API  
- **GET** `/api/lost-time-reasons/` - Liste des motifs de temps perdu actifs
- **GET/POST/DELETE** `/api/lost-time-entries/` - Gestion des entrées de temps perdu
- **GET** `/api/lost-time-entries/stats/` - Statistiques de temps perdu

### Catalog API
- Endpoints configurables pour les autres ressources catalogue

## Modèles WCM détaillés

### Mode
- Modes de fonctionnement machine (Permissif, Dégradé, Maintenance)
- Champs : name, description, is_enabled, is_active

### MoodCounter
- Compteur d'humeur anonyme
- Types : no_response, happy, unhappy, neutral
- Incrémente un compteur à chaque sélection

### LostTimeEntry
- Entrées de temps d'arrêt liées à un shift ou session_key
- Relations : shift, reason (WcmLostTimeReason), created_by
- Champs : duration (minutes), comment

### ChecklistResponse
- Réponses aux items de check-list
- Choix : ok, na, nok
- Contrainte unique : [shift, item]
- Commentaire obligatoire si NOK

## Architecture des composants frontend

### Composants frontend récents

#### Déclaration de temps
```
frontend/
├── static/frontend/
│   ├── css/declaration-temps.css    # Styles spécifiques
│   └── js/declaration-temps.js      # Logique Alpine.js
└── templates/frontend/
    └── components/
        └── declaration-temps.html   # Template du composant
```

**Pattern Alpine.js** :
- Chargement automatique des motifs d'arrêt via API
- Calcul en temps réel des statistiques (total, nombre)
- Gestion CRUD complète des arrêts
- Émission d'événements pour synchronisation (`lost-time-updated`)
- Liste déroulante de durées pré-définies (5min à 8h par pas de 5min)

#### Zone Rouleau (composant grille qualité)
```
frontend/
├── static/frontend/
│   ├── css/
│   │   ├── zone-rouleau.css     # Styles principaux
│   │   ├── animations.css       # Bibliothèque d'animations
│   │   └── components/
│   │       └── badges.css       # Badges de validation
│   └── js/rouleau.js            # Logique Alpine.js complexe
└── templates/frontend/components/
    └── rouleau.html             # Template grille 12x7
```

**Fonctionnalités avancées** :
- Grille fixe 12x7 (G1, C1, D1, métrage, G2, C2, D2)
- Validation épaisseur en temps réel avec badges visuels
- Gestion NOK avec récupération et multiples NOK
- Navigation clavier optimisée (Tab/Shift+Tab)
- Animations CSS3 (bounceIn, slideAndBounce, fadeIn/Out)
- Indicateurs visuels multiples (badges verts/rouges, ciseaux animés)

## Tests

Actuellement, aucun test n'est implémenté. Les fichiers `tests.py` existent mais sont vides dans toutes les applications.

## Absence notable

- **Pas de requirements.txt** : Les dépendances sont documentées mais pas dans un fichier requirements
- **Pas de configuration de linter** : Aucun outil de lint configuré (ruff, flake8, pylint)
- **Pas de Makefile** : Aucun script d'automatisation
- **Pas de commandes de management personnalisées** : Uniquement les commandes Django par défaut
- **Pas de fichiers de configuration CI/CD**

## Sécurité et déploiement

- **DEBUG = True** en développement (à désactiver en production)
- **SECRET_KEY** hardcodé dans settings.py (à externaliser en production)
- **ALLOWED_HOSTS = []** (à configurer pour production)
- Utilise les sessions Django pour la persistance
- Token CSRF requis pour toutes les requêtes POST/PATCH/DELETE

## Pattern de développement récents

### Nouvelle API WCM pour temps perdus
- ViewSets DRF complets avec serializers
- Filtrage automatique par session courante
- Statistiques agrégées disponibles
- Intégration avec le catalogue de motifs

### Architecture modulaire CSS/JS
Le projet suit une architecture strictement modulaire :
- Un fichier CSS par fonctionnalité
- Un fichier JS par composant Alpine.js
- Templates isolés et réutilisables
- Pas de logique dans les templates HTML

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

/* animations.css - Bibliothèque d'animations (nouveau) */
- Animations réutilisables (@keyframes)
- Classes utilitaires (.animate-*)
- Patterns : bounce, slide, fade, pulse

/* components/[component].css - Styles de composants isolés */
- Ex: components/badges.css pour badges réutilisables
- Pattern @extend pour héritage CSS (non standard, à convertir)

/* [feature].css - Styles spécifiques */
- Ex: fiche-poste.css, zone-rouleau.css
- Import des dépendances avec @import
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

### Patterns UI zone rouleau
- **Grille qualité fixe** : 12 lignes × 7 colonnes (G1, C1, D1, métrage, G2, C2, D2)
- **Badges de validation** : Verts (OK), rouges (NOK/défauts) avec animations bounceIn
- **Navigation optimisée** : Tab/Shift+Tab avec focus visible
- **Sélecteur de défauts** : Positionnement dynamique selon la cellule active
- **Indicateurs visuels** : Ciseaux animés pour lignes non conformes
- **États multiples** : Cellule vide → épaisseur → défaut → combiné
  - Badge vert : épaisseur OK
  - Badge rouge à gauche : première épaisseur NOK
  - Badge rouge à droite : défaut visuel
  - Input rouge : deuxième épaisseur NOK (non rattrapée)
  - Ligne pointillée + ciseaux : ligne à découper
- **Interactions utilisateur** :
  - Click sur cellule : ouvre sélecteur de défaut
  - Click sur badge : supprime le défaut/NOK
  - Tab/Shift+Tab : navigation entre épaisseurs
  - Enter : valide la saisie d'épaisseur
- **Feedback immédiat** :
  - Animations de validation (pulse, bounce)
  - Changement de couleur du badge conformité
  - Apparition progressive des indicateurs

## Mémoires de développement

- **Un champ vide doit afficher --**
- **Les IDs auto-générés ne doivent JAMAIS être modifiés**
- **Toujours utiliser des includes pour les composants réutilisables**
- **Pas de styles inline dans le HTML final**
- **Commentaires en français dans le code**
- **Ne jamais créer de fichiers de documentation non demandés**

## Configuration Django

### Settings principaux
- **Language** : `fr-fr` (français)
- **Timezone** : `Europe/Paris`
- **Static files** : `/static/` (collectstatic non configuré)
- **Media files** : `/media/` (stockage fichiers uploadés)
- **Apps installées** : catalog, production, quality, planification, wcm, livesession, frontend

### Sécurité et déploiement
- **ATTENTION** : DEBUG=True et SECRET_KEY hardcodée (dev uniquement)
- **ALLOWED_HOSTS** : Vide (accepte tout en dev)
- **CSRF** : Activé - utiliser `{% csrf_token %}` dans les formulaires

## API REST Endpoints

### Session API (`/api/session/`)
- **PATCH** : Met à jour la session courante
  - Champs : operator_id, shift_date, vacation, profile_id, fabrication_order_id
  - Synchronise avec CurrentProfile et session Django
  - Retourne l'état complet de la session

### WCM API (`/wcm/api/`)
- **`/wcm/api/lost-time-reasons/`** : Liste des motifs de temps perdu
- **`/wcm/api/lost-time-entries/`** : CRUD des entrées de temps perdu
  - GET : Liste filtrée par shift_id
  - POST/PUT/DELETE : Gestion complète
  - Calculs automatiques de durée

### Stats API (`/api/stats/<date>/<vacation>/`)
- Agrégation des données de production
- Inclut TRS, grammage moyen, temps perdus

## Modèles WCM détaillés

### Mode (wcm/models.py)
- Modes de fonctionnement machine : ARRET, MARCHE, CHANGEMENT_BOBINE_MERE
- Tracking automatique avec timestamps

### MoodCounter (wcm/models.py)
- Compteurs d'humeur anonymes (GOOD, NEUTRAL, BAD)
- Reset automatique à minuit

### LostTimeEntry (wcm/models.py)
- Entrées de temps perdu avec motif, début, fin
- Calcul automatique de la durée
- Lié à un poste (Shift)

### ChecklistResponse (wcm/models.py)
- Réponses aux items de checklist
- Booléen checked + commentaire optionnel
- Lié à shift_id et checklist_item_id

## Architecture des composants frontend récents

### Composant declaration-temps
```
frontend/static/frontend/
├── css/declaration-temps.css    # Styles spécifiques
├── js/declaration-temps.js      # Logique Alpine.js
└── templates/frontend/components/
    └── declaration-temps.html   # Template isolé
```

**Fonctionnalités du composant** :
- Auto-save des temps perdus
- Calcul automatique des durées
- Validation en temps réel
- Gestion des chevauchements
- Mode édition/suppression inline

**Pattern Alpine.js utilisé** :
- Store global pour partage d'état
- Watchers pour auto-save
- Computed properties pour calculs
- Event bus pour communication

### Composant rouleau (nouveau)
```
frontend/static/frontend/
├── css/
│   ├── zone-rouleau.css      # Styles spécifiques du rouleau
│   ├── animations.css        # Animations communes réutilisables
│   └── components/
│       └── badges.css        # Styles des badges et indicateurs
├── js/rouleau.js             # Logique Alpine.js complète
└── templates/frontend/components/
    └── rouleau.html          # Template du composant
```

**Fonctionnalités du composant** :
- Grille de contrôle qualité 12 lignes x 7 colonnes
- Saisie d'épaisseurs avec validation temps réel
- Gestion des défauts avec sélecteur dynamique
- Calcul automatique de conformité
- Navigation clavier optimisée (Tab/Shift+Tab)
- Animations sophistiquées pour feedback visuel

**Architecture CSS modulaire avancée** :
- `animations.css` : Bibliothèque d'animations réutilisables
  - bounceIn, slideAndBounce, fadeIn/Out, pulse
  - Classes utilitaires : `.animate-bounce-in`, `.animate-pulse`, etc.
- `zone-rouleau.css` : Styles spécifiques avec @import animations
- `components/badges.css` : Styles communs pour badges (pattern @extend)

**Patterns d'animation** :
- Animations séquentielles avec `--col-index` et animation-delay
- Feedback visuel immédiat (validatePulse, popFromBehind)
- Transitions d'état avec transformations 3D
- Icônes animées (ciseaux) pour lignes non conformes

**Gestion d'état complexe** :
- Double système d'épaisseurs (OK/NOK avec rattrapage)
- États de cellules multiples (vide, épaisseur, défaut, combiné)
- Événements custom pour synchronisation (`rouleau-updated`)
- Position dynamique du sélecteur de défauts

## Tests

Les fichiers de tests existent mais sont vides :
- `catalog/tests.py`
- `production/tests.py`
- `quality/tests.py`
- `wcm/tests.py`
- `planification/tests.py`

Aucune configuration de tests n'est implémentée.

## Absences notables

- **Pas de requirements.txt** (dépendances non documentées)
- **Pas de configuration de linter** (ruff, flake8, black)
- **Pas de Makefile** ou scripts d'automatisation
- **Pas de commandes de gestion personnalisées**
- **Pas de configuration CI/CD**

## Patterns de développement récents

1. **Nouvelle API WCM** avec DRF ViewSets complets
2. **Architecture CSS/JS strictement modulaire**
3. **Composants frontend isolés** (HTML/CSS/JS séparés)
4. **Auto-save systématique** via Alpine.js watchers
5. **Validation temps réel** côté frontend
6. **Animations CSS avancées** avec bibliothèque réutilisable
7. **Navigation clavier optimisée** dans les formulaires complexes
8. **Gestion d'état multi-niveaux** (badges, inputs, indicateurs)
9. **CSS Custom Properties** pour animations séquentielles
10. **Positionnement dynamique** d'éléments UI (sélecteur défauts)