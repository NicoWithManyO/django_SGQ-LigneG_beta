# Notes de Refactoring - SGQ Ligne G

Ce document liste les opportunités de refactoring identifiées dans le code.

## 🔴 Priorité HAUTE

### 1. Fichier roll.js trop volumineux (752 lignes !)
**Problème** : Le fichier gère trop de responsabilités différentes
**Solution** : 
- Séparer en modules : `roll-thickness.js`, `roll-defects.js`, `roll-grid.js`, `roll-conformity.js`
- Extraire la logique métier complexe dans `roll-business-logic.js` (déjà commencé mais peut être étendu)
- Fonction `handleThicknessInput` trop complexe à refactorer
- La logique de conformité devrait être entièrement dans `roll-business-logic.js`

### 2. Gestion d'erreurs dupliquée
**Problème** : Pattern `console.error` répété dans 7 fichiers
**Fichiers concernés** : `api.js`, `data-loader.js`, `time-declaration.js`, `checklist.js`, `roll.js`, `shared-mixins.js`, `production-order.js`
**Solution** : 
```javascript
// Créer utils/error-handler.js
export function handleError(context, error) {
    console.error(`Erreur ${context}:`, error);
    // Possibilité d'ajouter du monitoring/logging
    return false;
}
```

### 3. Méthodes saveToSession dupliquées
**Problème** : Plusieurs composants réimplémentent la même logique
**Fichiers concernés** : `shift-form.js`, `sticky-bottom.js`, `production-order.js`, `shared-mixins.js`
**Solution** : Utiliser systématiquement `api.saveToSession()` au lieu de réimplémenter

## 🟡 Priorité MOYENNE

### 4. Magic numbers et valeurs hardcodées
**JavaScript** :
- Debounce delay : `300` ms dans `shared-mixins.js`
- Pixel offset : `2` px dans `roll.js`

**CSS** :
- Dimensions : `width: 31px`, `height: 80px`, `min-width: 60px`
- Media queries : `768px`, `992px`, `1200px`

**Solution** :
```javascript
// Créer config/constants.js
export const UI_CONSTANTS = {
    DEBOUNCE_DELAY: 300,
    ANIMATION_DURATION: 600,
    // etc.
};
```

### 5. Requêtes DOM répétées
**Problème** : `querySelector` appelé plusieurs fois pour les mêmes éléments
**Solution** :
```javascript
// Au démarrage du composant
init() {
    // Cache DOM
    this.elements = {
        targetLength: this.$el.querySelector('input[x-model="targetLength"]'),
        operatorSelect: this.$el.querySelector('select[x-model="operatorId"]')
    };
}
```

## 🟢 Priorité BASSE

### 6. Nommage incohérent des méthodes
**Problème** : Mélange de patterns `get`, `load`, accès direct
**Exemples** :
- `getDefectCode()` vs `loadDefectTypes()`
- `targetLength` property vs `getTargetLength()` method

**Convention proposée** :
- `get*` : pour les valeurs calculées/dérivées
- `load*` : pour les opérations asynchrones
- `fetch*` : pour les appels API
- Propriétés directes : pour l'état simple

### 7. Performance - Mémoization manquante
**Problème** : Valeurs recalculées à chaque accès
**Méthodes concernées** : `getDefectCount()`, `hasThicknessOk()`, `isThicknessRow()`
**Solution** :
```javascript
// Utiliser un cache simple
_defectCountCache: null,
getDefectCount(typeId) {
    if (!this._defectCountCache) {
        this._defectCountCache = {};
    }
    if (!(typeId in this._defectCountCache)) {
        this._defectCountCache[typeId] = this.defects.filter(d => d.typeId == typeId).length;
    }
    return this._defectCountCache[typeId];
}
```

### 8. Séparation logique métier / UI
**Problème** : Composants mélangent logique métier et gestion UI
**Solution** : Créer des services/modules séparés
```javascript
// services/thickness-validator.js
export class ThicknessValidator {
    static isValid(value, profile) {
        // Logique de validation
    }
}
```

## 🆕 À faire prochainement

### Gestion du statut du rouleau en temps réel ✅
**État** : FAIT - Le badge de conformité se met à jour en temps réel
**Implémenté** :
- Badge de conformité avec statut dynamique
- Règles de conformité complètes (défauts bloquants, seuils, épaisseurs NOK)
- Affichage des ciseaux sur la dernière ligne problématique

### Séparation roll.js en modules
**Problème** : 752 lignes dans un seul fichier
**À faire** :
- `roll-thickness.js` : Gestion des épaisseurs (validation, NOK, rattrapages)
- `roll-defects.js` : Gestion des défauts visuels
- `roll-conformity.js` : Logique de conformité (actuellement dans roll.js)
- `roll-grid.js` : Gestion de l'affichage de la grille

### Badge de conformité et HTML/CSS
**À améliorer** :
- Le badge est maintenant intégré dans roll.html (couplage fort)
- Pourrait être un composant séparé réutilisable
- CSS du badge dispersé dans roll-zone.css

## 📝 Notes additionnelles

### Patterns à conserver
- Utilisation d'Alpine.js pour la réactivité
- Architecture de session persistante
- Séparation des responsabilités entre apps Django

### Anti-patterns à éviter
- Duplication de code
- Magic numbers
- Requêtes DOM non cachées
- Logique métier dans les templates

### Prochaines étapes
1. Commencer par découper `roll.js`
2. Créer le module `error-handler.js`
3. Unifier l'utilisation de `api.saveToSession()`
4. Documenter les nouveaux patterns dans `patterns.md`

## 🔧 Outils utiles pour le refactoring

### Analyse de code
- Identifier les duplications : `grep -r "console.error" frontend/static/frontend/js/`
- Compter les lignes : `wc -l frontend/static/frontend/js/*.js | sort -n`
- Trouver les magic numbers : rechercher les nombres dans le code

### Tests
- S'assurer que les tests passent avant/après refactoring
- Ajouter des tests pour les nouvelles fonctions utilitaires

### Documentation
- Mettre à jour `patterns.md` avec les nouveaux patterns
- Documenter les décisions de refactoring dans ce fichier