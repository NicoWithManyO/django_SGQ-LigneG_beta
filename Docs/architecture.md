# Architecture SGQ Ligne G

## Vue d'ensemble du système

```
┌─────────────────────────────────────────────────────────────────────┐
│                            FRONTEND                                  │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐    ┌─────────────┐    ┌───────────────┐         │
│  │   Templates  │    │  Static JS  │    │   Static CSS  │         │
│  │  (Django)    │    │  (Alpine)   │    │  (Bootstrap)  │         │
│  └──────┬───────┘    └──────┬──────┘    └───────────────┘         │
│         │                   │                                       │
│         └───────────┬───────┘                                      │
│                     ▼                                               │
│              ┌─────────────┐                                        │
│              │   Views     │                                        │
│              │  (Django)   │                                        │
│              └──────┬──────┘                                        │
└─────────────────────┼───────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         BACKEND API                                  │
├─────────────────────────────────────────────────────────────────────┤
│  ┌───────────────┐    ┌────────────────┐    ┌─────────────────┐   │
│  │  Session API  │    │  Production    │    │    Quality      │   │
│  │ (/api/session)│    │     API        │    │      API        │   │
│  └───────┬───────┘    └────────┬───────┘    └────────┬────────┘   │
│          │                     │                      │             │
│          └─────────────┬───────┴──────────────────────┘            │
│                        ▼                                            │
│              ┌──────────────────┐                                  │
│              │   Serializers    │                                  │
│              │  (DRF)          │                                  │
│              └────────┬─────────┘                                  │
└──────────────────────┼─────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           MODELS                                     │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │   Catalog    │  │  Production  │  │   Quality    │            │
│  │  - Profile   │  │  - Shift     │  │  - Defect    │            │
│  │  - SpecItem  │  │  - Roll      │  │  - Control   │            │
│  │  - ParamItem │  │  - Current*  │  │              │            │
│  └──────────────┘  └──────────────┘  └──────────────┘            │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │ Planification│  │     WCM      │  │  LiveSession │            │
│  │  - Operator  │  │  - Checklist │  │  - Session   │            │
│  │  - Order     │  │  - LostTime  │  │              │            │
│  └──────────────┘  └──────────────┘  └──────────────┘            │
└─────────────────────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         DATABASE                                     │
│                        (SQLite/PostgreSQL)                           │
└─────────────────────────────────────────────────────────────────────┘
```

## 🔄 Flux de Données Actuels

### Session Management Flow
```
User Input → Alpine.js Component → Session API → Django Session → Page Reload → Restore
     ↓                                                                    ↑
     └────────────────────── Auto-save (debounced) ─────────────────────┘
```

### Component Communication (Actuel - Problématique)
```
┌─────────────┐     window.events      ┌─────────────┐
│   Roll.js   │ ←------------------→  │Quality.js   │
└─────────────┘                       └─────────────┘
       ↓              DOM Query              ↑
       └──────────────────────────────────────┘
              (Fragile, Race Conditions)
```

## 🏗 Architecture des Composants Frontend

### Organisation Actuelle (21 fichiers JS)
```
frontend/static/js/
├── Core Infrastructure
│   ├── common.js          # Utilitaires globaux
│   ├── api.js            # Client API
│   ├── data-loader.js    # Chargement initial
│   └── shared-mixins.js  # Mixins Alpine.js
│
├── Business Components
│   ├── roll.js           # Composant principal (500+ lignes)
│   ├── roll-*.js         # Sous-modules roll (6 fichiers)
│   ├── quality-control*.js # Contrôle qualité (3 fichiers)
│   ├── profile*.js       # Gestion profils (2 fichiers)
│   └── shift-form.js     # Formulaire poste
│
└── UI Components
    ├── checklist.js      # Check-lists
    ├── time-declaration.js # Temps perdus
    └── kpi-calculations.js # Calculs KPI
```

### Points de Couplage Fort

#### 1. Dépendances Temporelles
```javascript
// quality-control.js - ANTI-PATTERN
setTimeout(() => {
    const profileComponent = document.querySelector('[x-data*="profileManager"]');
    if (profileComponent?.__x) {
        this.currentProfile = profileComponent.__x.$data.selectedProfile;
    }
}, 100);
```

#### 2. Communication par Events Globaux
```javascript
// 15+ événements différents
window.addEventListener('profile-changed', handler);
window.addEventListener('quality-control-updated', handler);
window.addEventListener('target-length-changed', handler);
// Difficile de tracer qui écoute quoi
```

#### 3. État Partagé via Window
```javascript
window.sessionData = {...};     // État global
window.operatorsData = {...};   // Données partagées
window.kpiCalculations = {...}; // Fonctions globales
```

## 🎯 Architecture Cible Recommandée

### Flux de Données Amélioré
```
┌─────────────────────────────────────────────────────┐
│                  State Store                         │
│             (Alpine.js Global Store)                 │
├─────────────────────────────────────────────────────┤
│  - Profile State                                    │
│  - Session State                                    │
│  - UI State                                         │
└────────────────┬────────────────────────────────────┘
                 │ Pub/Sub Pattern
    ┌────────────┼────────────┬─────────────┐
    ▼            ▼            ▼             ▼
┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐
│ Roll   │  │Quality │  │Profile │  │  KPI   │
│Component│  │Control │  │Component│  │Component│
└────────┘  └────────┘  └────────┘  └────────┘
```

### Organisation Modulaire Proposée
```
frontend/
├── core/
│   ├── api/
│   │   ├── client.js      # API client centralisé
│   │   └── endpoints.js   # Configuration endpoints
│   ├── state/
│   │   ├── store.js       # Store Alpine.js
│   │   └── actions.js     # Actions centralisées
│   └── utils/
│       ├── validation.js  # Validations partagées
│       └── calculations.js # Calculs réutilisables
│
├── components/
│   ├── roll/
│   │   ├── index.js       # Point d'entrée
│   │   ├── grid.js        # Sous-composant grille
│   │   └── conformity.js  # Logique conformité
│   └── quality-control/
│       ├── index.js
│       └── validators.js
│
└── shared/
    ├── constants.js       # Constantes métier
    └── formatters.js      # Formatters partagés
```

## 🔌 Points d'Intégration Backend

### APIs REST Actuelles
- `/api/session/` - Gestion session temporaire
- `/api/profiles/` - Profils de production
- `/api/defect-types/` - Types de défauts
- `/api/checklist/template/{id}/` - Templates checklist

### Problèmes d'Intégration
1. **Pas de versioning API** - Risque de breaking changes
2. **Endpoints non-RESTful** - Incohérence dans les patterns
3. **Sérialisation complète** - Transferts de données volumineux

## 📊 Métriques d'Architecture

### Complexité Actuelle
- **Couplage** : 15+ dépendances inter-composants
- **Cohésion** : Faible (logique métier mélangée avec UI)
- **Duplication** : ~23% de code répété
- **Testabilité** : Très faible (dépendances globales)

### Objectifs d'Architecture
- **Couplage** : < 5 dépendances directes par composant
- **Cohésion** : Haute (séparation claire des responsabilités)
- **Duplication** : < 10%
- **Testabilité** : > 80% du code testable isolément

## 🚨 Risques Architecturaux

### Court Terme
1. **Race conditions** entre composants
2. **Memory leaks** dus aux event listeners
3. **Performances dégradées** avec volume de données

### Long Terme
1. **Maintenance impossible** sans refactoring majeur
2. **Évolution bloquée** par l'architecture monolithique
3. **Onboarding difficile** pour nouveaux développeurs

## 🛤 Chemin de Migration

### Phase 1 : Stabilisation
- Documenter toutes les dépendances
- Ajouter tests sur points critiques
- Créer abstractions pour points de couplage

### Phase 2 : Modularisation
- Extraire logique métier des composants UI
- Implémenter state store centralisé
- Migrer vers modules ES6

### Phase 3 : Optimisation
- Lazy loading des composants
- API versionnée avec cache
- Monitoring performance

---

*Document vivant - À mettre à jour à chaque changement architectural majeur*