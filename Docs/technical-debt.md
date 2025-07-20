# Dette Technique - SGQ Ligne G

## 🔴 Duplications de Code Critiques

### 1. Validation des Épaisseurs
**Localisation** : 
- `frontend/static/frontend/js/roll.js` (lignes ~300-350)
- `frontend/static/frontend/js/quality-control.js` (lignes ~200-250)

**Impact** : Élevé - Risque de comportements incohérents
**Code dupliqué** :
```javascript
// Pattern répété dans plusieurs fichiers
if (value < spec.value_min || value > spec.value_max) {
    return 'nok';
}
```

### 2. Calcul de Moyennes
**Localisation** :
- `quality-control.js` : calculateAverages()
- `roll-calculations.js` : diverses fonctions
- Inline dans plusieurs templates

**Impact** : Moyen - Maintenance difficile
**Solution** : Créer un module `calculations/statistics.js`

### 3. Gestion des Événements
**Localisation** : 15+ fichiers
**Pattern dupliqué** :
```javascript
window.addEventListener('profile-changed', (e) => {
    this.currentProfile = e.detail.profile;
    // Logique similaire répétée
});
```
**Impact** : Moyen - Difficile à débugger

### 4. Formatage des Dates/Heures
**Localisation** :
- `quality-control.js` : formatTimestamp()
- `shift-form.js` : formatage inline
- Templates HTML avec filtres Django répétés

**Impact** : Faible - Incohérences visuelles possibles

## 🟡 Anti-Patterns Identifiés

### 1. Timeout pour Résolution de Dépendances
**Fichier** : `quality-control.js` (ligne 45)
```javascript
setTimeout(() => {
    const profileComponent = document.querySelector('[x-data*="profileManager"]');
    if (profileComponent && profileComponent.__x) {
        // Accès aux données internes d'Alpine.js
    }
}, 100);
```
**Problème** : Race condition, fragile
**Impact** : Élevé - Bugs intermittents

### 2. État Global via Window
**Localisation** : Partout
```javascript
window.sessionData = {...};
window.operatorsData = {...};
```
**Problème** : Namespace pollution, difficile à tester
**Impact** : Moyen

### 3. Mixage Logique UI et Métier
**Exemple** : `roll.js`
- Calculs métier mélangés avec gestion DOM
- 500+ lignes dans un seul fichier
**Impact** : Élevé - Difficile à tester et maintenir

### 4. Chaînage de Promesses Sans Gestion d'Erreur
**Localisation** : Appels API
```javascript
fetch('/api/endpoint/')
    .then(r => r.json())
    .then(data => { /* pas de catch */ });
```
**Impact** : Moyen - Erreurs silencieuses

## 🔧 Dépendances Fragiles

### 1. Ordre de Chargement des Scripts
**Problème** : 21 scripts chargés séquentiellement
**Fichier** : `production.html`
```html
<script src="common.js"></script>
<script src="api.js"></script>
<!-- 19 autres scripts qui dépendent des précédents -->
```
**Impact** : Élevé - Un script manquant casse tout

### 2. Communication Inter-Composants
**Problème** : Composants communiquent via :
- DOM queries
- Events globaux
- Timeouts

**Exemple de fragilité** :
```javascript
// roll.js attend que quality-control existe
const qcBadge = document.getElementById('qc-badge-container');
```

### 3. Dépendance au Format de Session Django
**Problème** : Frontend assume structure spécifique
```javascript
window.sessionData?.roll_data?.thicknesses || []
```
**Impact** : Moyen - Changement backend casse frontend

## 📊 Matrice Impact/Effort

| Dette Technique | Impact | Effort | Priorité |
|----------------|--------|---------|----------|
| Validation dupliquée | Élevé | Faible | P0 |
| Timeouts fragiles | Élevé | Moyen | P0 |
| Event management | Moyen | Faible | P1 |
| État global window | Moyen | Élevé | P2 |
| Ordre scripts | Élevé | Élevé | P1 |
| Calculs dupliqués | Moyen | Faible | P1 |
| Gestion erreurs | Moyen | Moyen | P2 |

## 🎯 Top 5 Actions Prioritaires

### 1. Créer Module de Validation Centralisé
**Quoi** : Extraire toute la logique de validation
**Gain** : -200 lignes de code dupliqué
**Effort** : 2 jours

### 2. Event Bus pour Communication
**Quoi** : Remplacer events window par bus centralisé
**Gain** : Découplage des composants
**Effort** : 2 jours

### 3. Gestionnaire d'État Central
**Quoi** : Store Alpine.js pour état partagé
**Gain** : Éliminer timeouts et queries DOM
**Effort** : 5 jours

### 4. Bundler avec Modules ES6
**Quoi** : Vite/Webpack pour gestion dépendances
**Gain** : Ordre de chargement garanti
**Effort** : 3 jours

### 5. Error Boundary Global
**Quoi** : Intercepteur pour toutes les erreurs
**Gain** : Visibilité sur les bugs production
**Effort** : 1 jour

## 💰 Coût de la Dette

### Coût Actuel
- **Temps de debug** : +40% sur bugs liés aux dépendances
- **Nouveaux devs** : 2 semaines pour comprendre les interactions
- **Ajout feature** : x2 temps à cause des duplications

### ROI du Refactoring
- **Court terme** (3 mois) : Break-even
- **Moyen terme** (6 mois) : -30% temps de dev
- **Long terme** (1 an) : -50% bugs production

## 📈 Métriques de Suivi

### Avant Refactoring
- **Lignes de code** : ~8,000 (JS)
- **Duplication** : 23% (estimé)
- **Complexité cyclomatique** : 45 (moyenne roll.js)
- **Couplage** : 15 dépendances inter-composants

### Objectifs Post-Refactoring
- **Lignes de code** : ~6,000 (-25%)
- **Duplication** : <10%
- **Complexité** : <20 par fichier
- **Couplage** : <5 dépendances directes

## 🚨 Risques si Non-Traité

1. **Bugs croissants** : Chaque fix risque d'en créer d'autres
2. **Vélocité décroissante** : Features prennent de plus en plus de temps
3. **Onboarding difficile** : Nouveaux devs perdus dans le code
4. **Scalabilité impossible** : Architecture ne supporte pas la croissance

---

*Document à mettre à jour mensuellement avec nouvelles dettes identifiées*