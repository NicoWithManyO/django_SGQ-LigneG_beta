# Système d'événements inter-composants

## Vue d'ensemble

L'application utilise un système d'événements basé sur `window.dispatchEvent()` et `window.addEventListener()` pour permettre la communication entre les composants Alpine.js. Cette architecture découplée permet aux composants de rester indépendants tout en restant synchronisés.

## Liste des événements

### 1. `quality-control-updated`
- **Émis par** : `quality-control.js`
- **Quand** : Après mise à jour des valeurs de contrôle qualité ET au démarrage initial
- **Données** : `{ status: qcStatus, data: { micrometry, surfaceMass, dryExtract } }`
- **Écouté par** : `roll.js`, `shift-form.js`
- **Impact** : Met à jour le statut de conformité du rouleau et valide le formulaire de poste

### 2. `profile-changed`
- **Émis par** : `profile.js`
- **Quand** : Lors du changement de profil de production
- **Données** : `{ profile }` (objet profil complet)
- **Écouté par** : `quality-control.js`, `roll.js`
- **Impact** : Recharge les spécifications et réinitialise les validations

### 3. `app-data-loaded`
- **Émis par** : `data-loader.js`
- **Quand** : Au chargement initial des données de l'application
- **Données** : `{ defectTypes, templates, profiles, operators }` 
- **Écouté par** : `roll.js`
- **Impact** : Initialise les types de défauts disponibles

### 4. `of-changed`
- **Émis par** : `production-order.js`
- **Quand** : Lors du changement d'ordre de fabrication (OF)
- **Données** : `{ of }` (objet OF complet)
- **Écouté par** : `sticky-bottom.js`
- **Impact** : Met à jour l'affichage de l'OF en cours

### 5. `target-length-changed`
- **Émis par** : `production-order.js` (2 endroits)
- **Quand** : Lors du changement de la longueur cible
- **Données** : `{ targetLength }` (nombre)
- **Écouté par** : `roll.js`, `profile.js`
- **Impact** : Ajuste le nombre de lignes du rouleau et recalcule les positions d'épaisseur

### 6. `rouleau-updated`
- **Émis par** : `roll.js` (3 endroits)
- **Quand** : Après modifications du rouleau (défauts, épaisseurs, conformité)
- **Données** : `{ conformity, defectCount, thicknessCount, nokCount }`
- **Écouté par** : `sticky-bottom.js`
- **Impact** : Met à jour les compteurs dans la barre sticky

### 7. `profile-tab-changed`
- **Émis par** : `profile-tabs.js`
- **Quand** : Lors du changement d'onglet dans le profil
- **Données** : `{ tab }` (string: 'profile' ou 'kpi')
- **Écouté par** : Aucun actuellement
- **Impact** : Pour future extension

### 8. `lost-time-updated`
- **Émis par** : `time-declaration.js`
- **Quand** : Après modification des temps perdus
- **Données** : `{ tempsTotal }` (nombre en minutes)
- **Écouté par** : Script inline dans `production.html`
- **Impact** : Met à jour l'affichage du temps total perdu

### 9. `operator-changed`
- **Émis par** : `shift-form.js`
- **Quand** : Lors du changement d'opérateur
- **Données** : Aucune
- **Écouté par** : `checklist.js`
- **Impact** : Recharge la checklist pour le nouvel opérateur

## Conventions d'utilisation

### Émission d'un événement

```javascript
window.dispatchEvent(new CustomEvent('nom-evenement', {
    detail: {
        // données à transmettre
    }
}));
```

### Écoute d'un événement

```javascript
window.addEventListener('nom-evenement', (event) => {
    const data = event.detail;
    // traiter les données
});
```

### Dans un composant Alpine.js

```javascript
Alpine.data('monComposant', () => ({
    init() {
        // Écouter
        window.addEventListener('nom-evenement', (event) => {
            this.handleEvent(event.detail);
        });
        
        // Émettre
        this.emitEvent();
    },
    
    emitEvent() {
        window.dispatchEvent(new CustomEvent('mon-evenement', {
            detail: { data: this.data }
        }));
    }
}));
```

## Système de watchers Alpine.js

En complément des événements, l'application utilise les `$watch` d'Alpine.js pour surveiller les changements de valeurs locales :

### Principales valeurs surveillées

- **`selectedProfileId`** → déclenche le chargement du profil
- **`operatorId`** → émet `operator-changed`
- **`targetLength`** → valide et émet `target-length-changed`
- **`currentFO`** → émet `of-changed`
- **Valeurs de formulaire** → sauvegarde automatique dans la session

### Pattern de surveillance

```javascript
this.$watch('maValeur', (newValue) => {
    // Sauvegarder dans la session
    this.saveToSession();
    
    // Émettre un événement si nécessaire
    window.dispatchEvent(new CustomEvent('valeur-changed', {
        detail: { value: newValue }
    }));
});
```

## Bonnes pratiques

1. **Nommage** : Utiliser des noms d'événements en kebab-case descriptifs
2. **Données** : Toujours passer les données dans `detail`
3. **Documentation** : Documenter tout nouvel événement dans ce fichier
4. **Découplage** : Les composants ne doivent pas connaître leurs écouteurs
5. **Initialisation** : Configurer les listeners dans `init()` des composants Alpine.js

## Diagramme de flux

```
Profile Change Flow:
profile.js --[profile-changed]--> quality-control.js (reload specs)
                              \--> roll.js (update validations)

OF Change Flow:
production-order.js --[of-changed]--> sticky-bottom.js (update display)
                   \--[target-length-changed]--> roll.js (adjust grid)
                                             \--> profile.js (update)

Quality Control Flow:
quality-control.js --[quality-control-updated]--> roll.js (check conformity)
roll.js --[rouleau-updated]--> sticky-bottom.js (update counters)
```