# Logique Métier Frontend - SGQ Ligne G

## Vue d'ensemble

Le frontend utilise Alpine.js pour la réactivité et une architecture événementielle pour la communication entre composants. Les données sont persistées via une API de session et les calculs métier sont centralisés dans des modules dédiés.

## 1. Architecture des composants

### 1.1 Composants principaux

#### **Production Order** (`production-order.js`)
- **Responsabilité** : Gestion de l'ordre de fabrication (OF) et longueur cible
- **État géré** :
  - `currentFO` : Numéro d'OF actuel
  - `targetLength` : Longueur cible du rouleau
  - `cuttingOrder` : Type de découpe
- **Événements émis** :
  - `of-changed` : Quand l'OF change
  - `target-length-changed` : Quand la longueur cible change

#### **Profile** (`profile.js`)
- **Responsabilité** : Sélection et gestion du profil de production
- **État géré** :
  - `selectedProfileId` : ID du profil actif
  - `selectedProfile` : Données complètes du profil
  - `modes` : Modes de production activés
- **Événements émis** :
  - `profile-changed` : Quand le profil change (avec détails complets)

#### **Roll** (`roll.js`)
- **Responsabilité** : Grille du rouleau, épaisseurs et défauts
- **État géré** :
  - `thicknesses` : Épaisseurs valides saisies
  - `nokThicknesses` : Épaisseurs rejetées
  - `defects` : Défauts ajoutés
  - `isConform` : Statut de conformité calculé
- **Événements émis** :
  - `rouleau-updated` : À chaque modification (épaisseur, défaut)
- **Calculs** :
  - Conformité selon règles métier complexes
  - Nombre de lignes selon longueur cible

#### **Sticky Bottom** (`sticky-bottom.js`)
- **Responsabilité** : Barre de données du rouleau en cours
- **État géré** :
  - `rollNumber` : Numéro du rouleau
  - `rollId` : ID calculé (OF_numero)
  - `tubeMass`, `length`, `totalMass` : Données physiques
  - `netMass` : Masse nette calculée
  - `weight` : Grammage calculé
- **Calculs automatiques** :
  - `netMass = totalMass - tubeMass`
  - `weight = netMass / (length × feltWidth)`
  - `rollId = OF + "_" + rollNumber`

#### **Quality Control** (`quality-control.js`)
- **Responsabilité** : Contrôles qualité et validation
- **État géré** :
  - `micrometry`, `surfaceMass`, `dryExtract` : Moyennes calculées
  - `loi` : Loss on ignition
  - `qcStatus` : 'pending', 'passed', 'failed'
- **Événements émis** :
  - `quality-control-updated` : Quand le statut change
- **Validations** :
  - Comparaison avec seuils du profil
  - Calcul automatique du statut

#### **Shift Form** (`shift-form.js`)
- **Responsabilité** : Formulaire de poste (shift)
- **État géré** :
  - `operatorId`, `shiftDate`, `vacation` : Données du poste
  - `shiftId` : ID auto-généré
  - `isValid` : Validation du formulaire
- **Événements émis** :
  - `operator-changed` : Changement d'opérateur
- **Validations** :
  - Tous les champs requis
  - Contrôle qualité complété

### 1.2 Modules utilitaires

#### **Roll Calculations** (`roll-calculations.js`)
- Calculs métier centralisés :
  - `calculateNetMass()` : Masse nette
  - `calculateGrammage()` : Grammage en g/m²
  - `generateRollId()` : Format OF_XXX

#### **Roll Business Logic** (`roll-business-logic.js`)
- Règles métier :
  - `calculateRowCount()` : Nombre de lignes selon longueur
  - `isThicknessRow()` : Lignes avec mesures d'épaisseur
  - `countCellsWithNok()` : Cellules avec au moins un NOK

#### **Roll Conformity** (`roll-conformity.js`)
- Logique de conformité complexe :
  - Vérification des défauts bloquants
  - Seuils d'épaisseur NOK
  - Contrôle qualité complété
  - Première ligne d'épaisseur complète

#### **Quality Control Business Logic** (`quality-control-business-logic.js`)
- Calcul des moyennes et validations
- Détermination du statut (passed/failed)
- Seuils par défaut et du profil

## 2. Flux de données et dépendances

### 2.1 Chaîne de dépendances principale

```
Profile Selection
    ↓ (profile-changed)
    ├→ Roll Component
    │   - Charge les seuils d'épaisseur
    │   - Valide selon le profil
    │
    ├→ Quality Control
    │   - Charge les seuils de qualité
    │   - Recalcule le statut
    │
    └→ Sticky Bottom
        - Charge les specs de masse surfacique
        - Valide le grammage

Production Order
    ↓ (of-changed)
    └→ Sticky Bottom
        - Recalcule rollId

Target Length Change
    ↓ (target-length-changed)
    └→ Roll Component
        - Recalcule le nombre de lignes
        - Réorganise la grille
```

### 2.2 Watchers Alpine.js

#### Sticky Bottom
- `$watch('rollNumber')` → Recalcule rollId → Sauvegarde session
- `$watch('tubeMass')` → Recalcule netMass → Recalcule weight
- `$watch('length')` → Recalcule weight → Sauvegarde session
- `$watch('totalMass')` → Recalcule netMass → Recalcule weight

#### Shift Form
- `$watch('operatorId')` → Génère shiftId → Émet operator-changed
- `$watch('shiftDate')` → Génère shiftId
- `$watch('vacation')` → Génère shiftId → Ajuste heures par défaut
- `$watch('machineStartedStart')` → Reset lengthStart si décoché
- `$watch('machineStartedEnd')` → Reset lengthEnd si décoché

#### Profile
- `$watch('selectedProfileId')` → Charge détails → Émet profile-changed
- `$watch('modes')` → Sauvegarde session

### 2.3 Event Listeners

#### Quality Control écoute :
- `profile-changed` : Met à jour les seuils

#### Roll écoute :
- `target-length-changed` : Met à jour la grille
- `profile-changed` : Met à jour les seuils d'épaisseur
- `quality-control-updated` : Met à jour le statut QC pour conformité
- `app-data-loaded` : Charge les types de défauts

#### Sticky Bottom écoute :
- `roll-updated` : Met à jour les données affichées
- `of-changed` : Met à jour l'OF pour calculer rollId
- `profile-changed` : Met à jour les specs de validation

#### Shift Form écoute :
- `quality-control-updated` : Pour validation du formulaire

#### Checklist écoute :
- `operator-changed` : Reset la signature
- `session-changed` : Recharge les données

## 3. Calculs automatiques

### 3.1 Calculs en cascade

1. **Masse nette** (Sticky Bottom)
   - Déclenché par : changement de `totalMass` ou `tubeMass`
   - Formule : `netMass = totalMass - tubeMass`
   - Déclenche : calcul du grammage

2. **Grammage** (Sticky Bottom)
   - Déclenché par : changement de `netMass` ou `length`
   - Formule : `weight = netMass / (length × feltWidth)`
   - Validation : comparaison avec specs du profil

3. **Roll ID** (Sticky Bottom)
   - Déclenché par : changement de `rollNumber` ou `currentFO`
   - Format : `{OF}_{rollNumber:03d}`

4. **Shift ID** (Shift Form)
   - Déclenché par : changement opérateur, date ou vacation
   - Format : `DDMMYY_FirstnameLast_Vacation`

5. **Moyennes QC** (Quality Control)
   - Déclenché par : saisie dans la grille 7×12
   - Calculs : moyennes par colonne et globale
   - Validation : contre seuils du profil

### 3.2 Validations métier

#### Conformité du rouleau
```javascript
isConform = 
    - Pas de défauts bloquants ET
    - Nombre NOK ≤ seuil (si défini) ET
    - Contrôle qualité != 'failed' ET
    - Si QC 'pending' : première ligne d'épaisseur complète
```

#### Statut contrôle qualité
```javascript
qcStatus = 
    - 'pending' : données incomplètes
    - 'passed' : toutes les moyennes dans les seuils
    - 'failed' : au moins une moyenne hors seuils
```

## 4. Gestion de l'état

### 4.1 Session API

Tous les composants sauvegardent via `api.saveToSession()` :
- Sauvegarde automatique via watchers
- Debounce de 500ms (shared-mixins)
- Restauration au chargement de la page

### 4.2 Données persistées

- **Production** : OF, longueur cible, ordre de découpe
- **Profile** : ID sélectionné, modes actifs
- **Roll** : Épaisseurs, défauts, positions
- **Sticky Bottom** : Toutes les données du rouleau
- **Quality Control** : Valeurs de la grille, moyennes
- **Shift Form** : Toutes les données du formulaire

## 5. Points de fragilité identifiés

### 5.1 Timeouts et race conditions

1. **Récupération du profil** (quality-control.js, sticky-bottom.js)
   ```javascript
   setTimeout(() => {
       const profileComponent = document.querySelector('[x-data*="profileManager"]');
       if (profileComponent && profileComponent.__x) {
           // Accès à l'API interne d'Alpine
       }
   }, 100);
   ```
   **Problème** : Timeout arbitraire, accès à `__x` non documenté

2. **Déplacement du badge QC**
   ```javascript
   setTimeout(() => {
       const badge = document.getElementById('qc-badge');
       // Déplacement DOM
   }, 50);
   ```

3. **État initial du rouleau**
   ```javascript
   setTimeout(() => {
       this.updateEpaisseurDisplay();
   }, 100);
   ```

### 5.2 Dépendances fragiles

- Accès direct à `__x.$data` d'Alpine.js
- Sélecteurs CSS pour trouver les composants
- Ordre d'initialisation non garanti

### 5.3 Recommandations

1. **Remplacer les timeouts par des événements**
   - Le profileManager devrait émettre un événement 'ready'
   - Utiliser Alpine.store() pour partager l'état

2. **Éviter l'accès à l'API interne d'Alpine**
   - Utiliser des événements custom ou Alpine.store()

3. **Centraliser la gestion d'état**
   - Store global pour profil, OF, etc.
   - Réduire les dépendances entre composants

## 6. Diagramme des événements principaux

```
┌─────────────────┐
│ Profile Select  │
└────────┬────────┘
         │ profile-changed
         ├────────────────┐
         │                │
    ┌────▼────┐      ┌────▼────┐
    │  Roll   │      │   QC    │
    └────┬────┘      └────┬────┘
         │                │
         │ rouleau-       │ quality-control-
         │ updated        │ updated
         │                │
    ┌────▼────────────────▼────┐
    │     Roll Conformity      │
    └──────────────────────────┘

┌─────────────────┐
│ Production Order│
└────────┬────────┘
         │ of-changed
         │ target-length-changed
         │
    ┌────▼────┐
    │  Roll   │
    │ Sticky  │
    └─────────┘
```

## 7. Événements custom référence

| Événement | Émetteur | Données | Écouteurs |
|-----------|----------|---------|-----------|
| `profile-changed` | Profile | `{profileId, profile, modes}` | Roll, QC, Sticky Bottom |
| `of-changed` | Production Order | `{currentFO}` | Sticky Bottom |
| `target-length-changed` | Production Order | `{length}` | Roll, Profile |
| `rouleau-updated` | Roll | `{thicknessCount, nokCount, defectCount, isConform}` | - |
| `quality-control-updated` | Quality Control | `{status, data}` | Shift Form, Roll |
| `operator-changed` | Shift Form | - | Checklist |
| `lost-time-updated` | Time Declaration | `{tempsTotal}` | - |
| `app-data-loaded` | Data Loader | `{defectTypes, ...}` | Roll |