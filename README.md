# SGQ Ligne G

Système de gestion de production pour l'industrie manufacturière.

## 🚀 Installation rapide

```bash
# Cloner le projet
git clone [url-du-repo]
cd django_SGQ-LigneG_beta

# Créer l'environnement virtuel
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# ou
.venv\Scripts\activate  # Windows

# Installer les dépendances
pip install django==5.2.4 djangorestframework==3.15.2
# Note: pas de requirements.txt pour le moment

# Initialiser la base de données
python manage.py migrate

# Créer un administrateur
python manage.py createsuperuser

# Lancer le serveur
python manage.py runserver
```

## 📋 Fonctionnalités

- **Gestion des postes** : Création et suivi des postes avec ID auto-généré
- **Suivi production** : Traçabilité complète des rouleaux et ordres de fabrication  
- **Contrôle qualité** : Grille de contrôle 12x7 avec validation en temps réel
- **WCM** : Gestion des temps perdus et check-lists
- **Interface moderne** : UI responsive avec animations CSS avancées
- **API REST** : Endpoints pour intégrations externes
- **Session persistante** : Sauvegarde automatique des données saisies
- **Zone rouleau avancée** : Navigation clavier optimisée et indicateurs visuels

## 🛠 Technologies

- Django 5.2.4
- Django REST Framework 3.15.2
- Bootstrap 5.3
- Alpine.js 3.x
- SQLite (dev) / PostgreSQL (prod recommandé)

## 📂 Structure du projet

```
django_SGQ-LigneG_beta/
├── catalog/        # Modèles de référence (profils, spécifications, défauts)
├── production/     # Gestion des postes et rouleaux
├── quality/        # Contrôles qualité et enregistrements
├── wcm/           # World Class Manufacturing (temps perdus, check-lists)
├── planification/ # Gestion des opérateurs et ordres de fabrication
├── livesession/   # API de gestion des sessions
└── frontend/      # Interface utilisateur et composants
```

## 🎨 Architecture Frontend

### Structure des fichiers

```
frontend/
├── static/frontend/
│   ├── css/
│   │   ├── variables.css         # Variables CSS globales (couleurs, tailles)
│   │   ├── base.css              # Reset et styles globaux
│   │   ├── components.css        # Composants réutilisables (accordions, badges)
│   │   ├── layout.css            # Mise en page et responsivité
│   │   ├── fiche-poste.css       # Styles spécifiques fiche de poste
│   │   ├── ordre-fabrication.css # Styles bloc ordre de fabrication
│   │   ├── sticky-bottom.css     # Styles barre fixe en bas
│   │   ├── zone-rouleau.css      # Styles composant rouleau
│   │   ├── animations.css        # Animations réutilisables
│   │   └── components/           # Styles modulaires des composants
│   │       └── badges.css        # Styles des badges et indicateurs
│   └── js/
│       ├── roll-calculations.js  # Module de calculs métier (masse, grammage)
│       ├── fiche-poste.js        # Composant Alpine.js fiche de poste
│       ├── ordre-fabrication.js  # Composant Alpine.js ordre de fabrication
│       ├── sticky-bottom.js      # Composant Alpine.js sticky bar
│       └── rouleau.js            # Composant Alpine.js rouleau complexe
├── templates/frontend/
│   ├── base.html                 # Template de base avec imports CSS/JS
│   ├── components/
│   │   ├── navbar.html           # Barre de navigation
│   │   ├── fiche-poste.html      # Composant formulaire fiche de poste
│   │   ├── ordre-fabrication.html # Composant bloc OF avec édition inline
│   │   ├── sticky-bottom.html    # Barre fixe données rouleau
│   │   └── rouleau.html          # Grille qualité 12x7 avec validation temps réel
│   └── pages/
│       ├── index.html            # Page d'accueil
│       └── production.html       # Page de production avec accordions
└── views.py                      # Vues Django et gestion des contextes
```

### Architecture modulaire

- **CSS organisé par responsabilité** : variables, base, composants, layout, features
- **Animations centralisées** : Fichier animations.css pour réutilisabilité
- **Styles modulaires** : Séparation des styles par composant (badges.css)
- **Logique métier séparée** : Module dédié pour les calculs (roll-calculations.js)
- **Composants Alpine.js** : État local réactif avec persistance automatique
- **Templates Django optimisés** : Utilisation de boucles pour éviter la répétition (DRY)
- **API REST** : Communication asynchrone avec sauvegarde en session
- **Design responsive** : Mobile-first avec Bootstrap 5.3

## 🆕 Dernières améliorations

### Composant Rouleau avancé
- Grille de qualité 12 lignes × 7 colonnes (G1, C1, D1, métrage, G2, C2, D2)
- Validation des épaisseurs en temps réel avec indicateurs visuels
- Gestion des défauts avec sélecteur dynamique
- Navigation clavier optimisée (Tab/Shift+Tab)
- Animations CSS sophistiquées (bounceIn, pulse, fadeIn/Out)
- Badges colorés pour feedback immédiat (vert=OK, rouge=NOK)

### Architecture CSS modulaire
- Bibliothèque d'animations réutilisables (`animations.css`)
- Styles de composants isolés (`components/badges.css`)
- Utilisation de CSS Custom Properties pour animations séquentielles
- Import modulaire avec `@import` pour les dépendances

