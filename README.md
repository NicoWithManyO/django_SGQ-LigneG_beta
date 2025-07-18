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
pip install -r requirements.txt
# ou
pip install django djangorestframework

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
- **Contrôle qualité** : Enregistrement des défauts et statuts
- **WCM** : Gestion des temps perdus et check-lists
- **Interface moderne** : UI responsive avec Bootstrap et Alpine.js
- **API REST** : Endpoints pour intégrations externes
- **Session persistante** : Sauvegarde automatique des données saisies

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
│   │   ├── base.css          # Reset et styles globaux
│   │   ├── components.css    # Composants réutilisables (accordions, badges)
│   │   ├── layout.css        # Mise en page et responsivité
│   │   └── fiche-poste.css   # Styles spécifiques fiche de poste
│   └── js/
│       └── fiche-poste.js    # Composant Alpine.js fiche de poste
├── templates/frontend/
│   ├── base.html              # Template de base avec imports CSS/JS
│   ├── components/
│   │   ├── navbar.html        # Barre de navigation
│   │   └── fiche-poste.html   # Composant formulaire fiche de poste
│   └── pages/
│       ├── index.html         # Page d'accueil
│       └── production.html    # Page de production avec accordions
└── views.py                   # Vues Django et gestion des contextes
```

### Architecture modulaire

- **CSS organisé par responsabilité** : base, composants, layout, features
- **Composants Alpine.js** : État local réactif avec persistance automatique
- **Templates Django** : Héritage et inclusion pour réutilisabilité
- **API REST** : Communication asynchrone avec sauvegarde en session
- **Design responsive** : Mobile-first avec Bootstrap 5.3

