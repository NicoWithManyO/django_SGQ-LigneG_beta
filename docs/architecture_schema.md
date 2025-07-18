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

## Flux de données

### 1. Session Management
```
Browser ──(Alpine.js)──> Session API ──> Django Session ──> Database
   ▲                                                           │
   └───────────────────(Page Reload)───────────────────────────┘
```

### 2. Component Architecture
```
┌─────────────────────────────────────┐
│         fiche_poste.html            │
├─────────────────────────────────────┤
│  - Structure HTML                   │
│  - Classes CSS réutilisables        │
│  - Binding Alpine.js                │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│         fiche_poste.js              │
├─────────────────────────────────────┤
│  Alpine.data('fichePoste')          │
│  - État local                       │
│  - Méthodes (saveToSession, etc.)  │
│  - Computed (shiftId)              │
│  - Watchers avec debounce          │
└─────────────────────────────────────┘
```

### 3. CSS Architecture
```
forms.css
├── .sgq-select     (Dropdowns)
├── .sgq-input      (Input fields)
└── .sgq-label      (Labels)

blocks.css
├── .sgq-block      (Container)
├── .sgq-block-header
└── .sgq-block-body

layout.css
├── .sgq-production-layout
├── .sgq-column-left
├── .sgq-column-center
└── .sgq-column-right
```

## Pattern Réutilisable

Le composant `fichePoste` suit un pattern réutilisable :

1. **Template Django** : Passe les données via le contexte
2. **JavaScript** : Initialise Alpine.js avec les données de session
3. **Session API** : Sauvegarde automatique avec debounce
4. **CSS modulaire** : Classes réutilisables sans styles inline

Ce pattern peut être répliqué pour d'autres composants.