# SGQ Ligne G - Système de Gestion Qualité

Système de gestion de production pour la ligne de fibrage, conforme aux normes ISO 9001, ISO 14001 et ISO 45001.

## 📋 Fonctionnalités

- **Gestion des postes** : Création et suivi des postes avec ID auto-généré (format: JJMMAA_PrenomNom_Vacation)
- **Suivi production** : Traçabilité complète des rouleaux et ordres de fabrication  
- **Contrôle qualité** : Grille de contrôle 12x7 avec validation en temps réel et calcul automatique NOK
- **WCM** : Gestion des temps perdus et check-lists de démarrage
- **Interface moderne** : UI responsive avec animations CSS avancées et Alpine.js
- **API REST** : Endpoints pour intégrations externes via Django REST Framework
- **Session persistante** : Sauvegarde automatique de toutes les données saisies via API dédiée
- **Zone rouleau avancée** : Navigation clavier optimisée, indicateurs visuels OK/NOK et grille adaptative

## 🛠 Technologies

- Django 5.2.4
- Django REST Framework 3.15.2
- Bootstrap 5.3
- Alpine.js 3.x
- SQLite (dev) / PostgreSQL (prod recommandé)

## 📐 Conventions de code

### Python/Django
- **PEP 8** : Respect des standards Python (indentation 4 espaces, ligne max 79 caractères)
- **Conventions Django** : 
  - Models au singulier (ex: `Operator`, `Roll`)
  - Apps au pluriel ou fonctionnel (ex: `production`, `quality`)
  - Vues basées sur les classes quand pertinent
- **Commentaires en français** : Documentation claire pour l'équipe francophone
- **Code en anglais** : Variables, fonctions et classes en anglais

### JavaScript
- **Code en anglais** : Variables, fonctions et méthodes en anglais uniquement
- **camelCase** : Pour les fonctions et variables JS
- **Composants Alpine.js** : Un fichier JS par composant

### CSS
- **kebab-case** : Pour les classes CSS
- **Architecture modulaire** : Un fichier CSS par fonctionnalité
- **Variables CSS** : Utilisation des custom properties

### HTML/Templates
- **kebab-case** : Pour les noms de fichiers template
- **Includes Django** : Composants réutilisables dans `components/`

## 📂 Structure du projet

```
django_SGQ-LigneG_beta/
├── catalog/        # Modèles de référence (profils, spécifications, défauts)
├── production/     # Gestion des postes et rouleaux
│   └── models/     # Modèles séparés : shift.py, roll.py, current.py
├── quality/        # Contrôles qualité et enregistrements
│   └── models/     # Modèles séparés : defect.py, thickness.py, control.py
├── wcm/           # World Class Manufacturing (temps perdus, check-lists)
├── planification/ # Gestion des opérateurs et ordres de fabrication
├── livesession/   # API de gestion des sessions
└── frontend/      # Interface utilisateur et composants
```

## 🔧 Fonctionnalités avancées

### Système de session persistante
- **Sauvegarde automatique** : Toutes les modifications sont sauvegardées instantanément
- **API REST dédiée** : `/api/session/` pour la gestion des données temporaires
- **Récupération après rafraîchissement** : Les données saisies sont restaurées automatiquement
- **Validation finale** : Transfert en base de données lors de la validation du poste

### Navigation optimisée (Zone rouleau)
- **Navigation clavier** : Tab/Shift+Tab entre les champs d'épaisseur
- **Sélection automatique** : Le contenu est sélectionné au focus
- **Validation temps réel** : Indicateurs visuels OK/NOK selon les spécifications
- **Grille dynamique** : Adaptation automatique à la longueur cible du rouleau

### Gestion des profils
Chaque profil de production définit :
- **Spécifications produit** : Épaisseur, micronnaire, masse surfacique avec tolérances
- **Paramètres machine** : Oxygène primaire, vitesse tapis, températures
- **Seuils d'alerte** : Valeurs min/max pour déclenchement d'alertes
- **Blocages** : Certaines spécifications peuvent bloquer la production si hors tolérance

### Check-lists de contrôle
- **Templates réutilisables** : Check-lists standards par défaut
- **Validation complète** : Tous les items doivent être cochés avant signature
- **Signature électronique** : Identification de l'opérateur validant
- **Persistance session** : Les réponses sont sauvegardées automatiquement

## 💡 Conseils d'utilisation

### Pour les opérateurs
1. **Toujours vérifier** l'identification au début du poste
2. **Saisir les épaisseurs** dès les mesures effectuées
3. **Déclarer immédiatement** les défauts détectés
4. **Rattraper rapidement** les épaisseurs non conformes
5. **Déclarer les temps perdus** pour améliorer le TRS

### Pour les superviseurs
1. **Consulter le TRS** en temps réel pour identifier les problèmes
2. **Analyser les temps perdus** pour optimiser la production
3. **Vérifier les check-lists** pour s'assurer du respect des procédures
4. **Exporter les données** pour les réunions de performance

### Pour la qualité
1. **Traçabilité complète** de chaque rouleau produit
2. **Historique des défauts** pour analyse des tendances
3. **Données d'épaisseur** pour contrôle statistique
4. **Conformité ISO** assurée par le système

## 🚨 Points d'attention

### IDs auto-générés (NE JAMAIS MODIFIER)
- `Operator.employee_id` : Format `PrenomNOM`
- `Shift.shift_id` : Format `JJMMAA_PrenomNom_Vacation`
- `Roll.roll_id` : Format `OF_NumRouleau` ou `ROLL_YYYYMMDD_HHMMSS`

### États machine
- `machine_started_start` : Machine allumée en début de poste
- `machine_started_end` : Machine reste allumée en fin de poste

## 🚀 Évolutions prévues

- Interface de supervision temps réel multi-lignes
- Application mobile pour contrôles terrain
- Intégration avec l'ERP pour synchronisation OF
- Tableaux de bord personnalisables
- Alertes automatiques sur dépassement de seuils
- Export des données pour analyses statistiques

