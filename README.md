# SGQ Ligne G - Système de Gestion Qualité

Système de gestion de production pour la ligne de fibrage, conforme aux normes ISO 9001, ISO 14001 et ISO 45001.

## 📋 Fonctionnalités

- **Gestion des postes** : Création et suivi des postes avec ID auto-généré (format: JJMMAA_PrenomNom_Vacation)
- **Suivi production** : Traçabilité complète des rouleaux et ordres de fabrication  
- **Contrôle qualité** : Grille de contrôle 12x7 avec validation en temps réel et calcul automatique NOK
- **WCM** : Gestion des temps perdus et check-lists de démarrage
- **Interface moderne** : Navigation intuitive avec animations visuelles pour guider l'opérateur
- **Intégrations** : Connecteurs disponibles pour systèmes externes (ERP, MES)
- **Session persistante** : Sauvegarde automatique de toutes les données saisies
- **Zone rouleau avancée** : Navigation clavier optimisée, indicateurs visuels OK/NOK et grille adaptative
- **Interface à onglets** : Système d'onglets pour les profils (Specs&Params et KPI/TRS)

## 🛠 Environnement technique

Le système utilise des technologies web modernes pour garantir fiabilité et performance :
- Interface web responsive accessible sur PC, tablette et mobile
- Base de données robuste pour la traçabilité
- Sauvegarde automatique pour éviter toute perte de données
- Compatible avec les navigateurs récents (Chrome, Firefox, Edge)

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

### Système de gestion des défauts
- **Trois niveaux de sévérité** :
  - **Bloquants** (rouge) : Arrêt immédiat de production avec animation ciseaux
  - **Non bloquants** (orange) : Production continue, défaut tracé
  - **Avec seuil** (orange) : Devient bloquant après X occurrences
- **Indicateurs visuels** :
  - Badges colorés selon la sévérité
  - Compteurs d'occurrences sur les badges (apparaît si > 1)
  - Seuils affichés dans le sélecteur (ex: "Tache (NOK 3)")
- **Animations conditionnelles** : Ciseaux uniquement pour défauts bloquants

### Système de session persistante
- **Sauvegarde automatique** : Toutes les modifications sont sauvegardées instantanément
- **Récupération après rafraîchissement** : Les données saisies sont restaurées automatiquement
- **Validation finale** : Transfert en base de données lors de la validation du poste
- **Protection contre les pertes** : Aucune donnée perdue même en cas de coupure réseau

### Contrôle qualité amélioré
- **Badge de statut intelligent** : Affichage pending/passed/failed selon l'état des contrôles
- **Validation numérique** : Saisie restreinte aux valeurs numériques avec formatage automatique
- **Horodatage** : Timestamps pour extrait sec et LOI
- **Labels de masse surfacique** : GG, GC, DC, DD pour une meilleure lisibilité
- **LOI obligatoire** : Le contrôle qualité ne peut être validé sans cocher la LOI

### Navigation optimisée (Zone rouleau)
- **Navigation clavier** : Tab/Shift+Tab entre les champs d'épaisseur
- **Sélection automatique** : Le contenu est sélectionné au focus
- **Validation temps réel** : Indicateurs visuels OK/NOK selon les spécifications
- **Grille dynamique** : Adaptation automatique à la longueur cible du rouleau

### Gestion des profils
Chaque profil de production définit :
- **Spécifications produit** : Épaisseur, micronnaire, masse surfacique avec tolérances
- **Paramètres machine** : Réglages optimaux pour chaque type de production
- **Seuils d'alerte** : Valeurs min/max pour déclenchement d'alertes
- **Blocages** : Certaines spécifications peuvent bloquer la production si hors tolérance
- **Interface à onglets** :
  - **Specs&Params** : Vue des paramètres machine et spécifications qualité
  - **KPI/TRS** : Indicateurs de performance en temps réel (TRS, disponibilité, performance, qualité)

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

## 🏗 Architecture Technique

### Stack Technologique
- **Backend** : Django 5.2.4 + Django REST Framework
- **Frontend** : Alpine.js 3.x pour la réactivité
- **CSS** : Bootstrap 5.3 + CSS personnalisé modulaire
- **Base de données** : SQLite (dev) / PostgreSQL (prod)

### Organisation du Code
- **Apps Django** : Séparées par domaine métier (catalog, production, quality, wcm)
- **Frontend modulaire** : 21 composants JavaScript indépendants
- **CSS par composant** : Un fichier CSS par fonctionnalité
- **API REST** : Endpoints versionnables pour évolution future

### Points Forts
- ✅ Architecture modulaire bien organisée
- ✅ Session persistante robuste
- ✅ Patterns documentés et réutilisables
- ✅ Séparation logique métier/UI

### Axes d'Amélioration
- ⚠️ Dépendances entre composants à réduire
- ⚠️ Performance à optimiser (bundling, lazy loading)
- ⚠️ Tests automatisés à implémenter
- ⚠️ Code dupliqué à factoriser (~23%)

📊 **Métriques de Performance**
- Temps de chargement : ~2.5s
- Taille bundle JS : ~350kb
- Watchers actifs : ~150

Pour plus de détails techniques, consulter :
- [Plan de Refactoring](Docs/refactoring-plan.md)
- [Architecture Détaillée](Docs/architecture.md)
- [Analyse de Performance](Docs/performance-analysis.md)

## 🚨 Points d'attention

### IDs auto-générés (NE JAMAIS MODIFIER)
- `Operator.employee_id` : Format `PrenomNOM`
- `Shift.shift_id` : Format `JJMMAA_PrenomNom_Vacation`
- `Roll.roll_id` : Format `OF_NumRouleau` ou `ROLL_YYYYMMDD_HHMMSS`

### États machine
- `machine_started_start` : Machine allumée en début de poste
- `machine_started_end` : Machine reste allumée en fin de poste

## 🤝 Contribution

### Standards de Code
- **Python** : PEP 8, code en anglais, commentaires en français
- **JavaScript** : ESLint (à configurer), camelCase
- **CSS** : BEM naming, kebab-case
- **Git** : Conventional commits en anglais

### Workflow
1. Créer une branche feature depuis `main`
2. Développer en suivant les conventions
3. Tester manuellement (tests auto à venir)
4. Pull request avec description détaillée

### Bonnes Pratiques
- Utiliser les patterns existants (voir Docs/patterns.md)
- Éviter la duplication de code
- Documenter les fonctions complexes
- Maintenir la séparation des responsabilités

