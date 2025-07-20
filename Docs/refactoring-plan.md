# Plan de Refactoring - SGQ Ligne G

## 📂 État Actuel de la Séparation HTML/CSS/JS

### ✅ Points Positifs
- **Structure claire** : Un fichier par type et par composant
- **Pas de code inline** : HTML propre, JS dans fichiers séparés
- **Convention de nommage** : kebab-case cohérent
- **Alpine.js bien utilisé** : x-data, x-show, x-model

### ⚠️ Points d'Amélioration
- **Fichiers JS trop gros** : roll.js (714 lignes), quality-control.js (479 lignes)
- **Logique métier dans l'UI** : Calculs et validations mélangés avec DOM
- **Duplication réelle** : Validation numérique répétée dans 5+ composants
- **État partagé fragile** : Communication par events window

## 🎯 Vision et Objectifs

### Objectifs Principaux
1. **Éliminer la duplication de code** (principe DRY) - Focus sur les vraies duplications
2. **Séparer logique métier et UI** sans casser le comportement existant
3. **Optimiser la maintenabilité** en gardant la simplicité Alpine.js
4. **Faciliter les tests** sur la logique métier extraite
5. **Préserver la stabilité** - Aucune régression fonctionnelle

### Métriques de Succès
- Réduction de 25% du code dupliqué (objectif réaliste)
- Zéro régression fonctionnelle
- Fichiers JS < 300 lignes
- Logique métier testable isolément

## 📊 Analyse d'Impact et Risques

### Risques Spécifiques Alpine.js
1. **Contexte `this` perdu** : Les méthodes extraites perdent l'accès au composant
   - *Mitigation* : Utiliser des wrappers ou passer le contexte en paramètre
2. **Événements `$event` dans templates** : Les handlers attendent cet objet spécial
   - *Mitigation* : Garder des méthodes proxy dans les composants
3. **Chaînage de méthodes** : `@blur="method1(); method2()"` - ordre critique
   - *Mitigation* : Préserver l'ordre exact dans les wrappers
4. **Accès aux propriétés réactives** : `this.currentProfile`, `this.thicknessSpec`
   - *Mitigation* : Passer en paramètres aux modules extraits

### Risques de Régression
1. **Validation numérique** : Comportement subtil avec virgules/points
   - *Mitigation* : Tests exhaustifs sur tous les cas
2. **État de session** : La sauvegarde doit rester identique
   - *Mitigation* : Ne pas toucher à la structure de session
3. **Classes CSS dynamiques** : Liées à la logique métier
   - *Mitigation* : Retourner statuts, laisser UI gérer les classes

### Impact Business
- **Court terme** : Aucune interruption de service
- **Moyen terme** : Développement plus rapide de nouvelles fonctionnalités
- **Long terme** : Réduction des coûts de maintenance

## 🚀 Roadmap en 3 Phases

### Phase 1 : Extractions Sécurisées (2 semaines)
*Extraction du code dupliqué SANS changer le comportement*

#### Semaine 1 - Duplications Réelles
- [ ] **Module de validation numérique** (3 jours)
  - Créer `validators/numeric-input.js`
  - Extraire `validateNumericInput()` et `formatNumber()`
  - Garder des wrappers dans les composants Alpine
  - Cas identifiés : quality-control.js (12 occurrences), roll.js
  - Estimation : 24h

- [ ] **Module de calculs partagés** (2 jours)
  - Créer `business-logic/calculations.js`
  - Extraire les calculs de moyennes (4 duplications)
  - Extraire la logique de conformité
  - Estimation : 16h

#### Exemple de Refactoring Sécurisé
```javascript
// validators/numeric-input.js
export const numericValidator = {
    validateKeypress(event) {
        const allowedKeys = ['0-9', '.', ',', 'Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight'];
        // Logique pure extraite
    },
    formatValue(value) {
        // Logique de formatage pure
        return formattedValue;
    }
};

// quality-control.js - WRAPPER qui garde le contexte Alpine
validateNumericInput(event) {
    numericValidator.validateKeypress(event);
},
formatNumber(event, type) {
    const formatted = numericValidator.formatValue(event.target.value);
    event.target.value = formatted;
    // Mise à jour du modèle Alpine préservée
    this.updateModel(event.target, formatted, type);
    // Chaînage préservé pour updateMicrometry(), etc.
}
```

#### Semaine 2 - Infrastructure
- [ ] **Tests de non-régression** (2 jours)
  - Capturer comportement actuel en vidéo
  - Créer checklist manuelle de validation
  - Tests sur tous les cas limites identifiés
  - Estimation : 16h

- [ ] **CSS Utilities** (3 jours)
  - Créer `css/utilities/forms.css`
  - Extraire styles dupliqués (.form-control custom, badges)
  - Remplacer progressivement sans casser
  - Estimation : 24h

**Total Phase 1 : 80h (1 développeur + tests)**

### Clarifications Importantes

#### "Valeurs Hardcodées" - Analyse Réelle
- **Seul cas trouvé** : `value < 5` dans roll.js ligne 617
- **Contexte** : Fallback de sécurité quand pas de profil chargé
- **Décision** : À conserver, c'est une protection légitime

#### Ce qui N'EST PAS à Refactorer
- ✅ **api.js** : Déjà bien centralisé
- ✅ **Session Django** : Ne pas toucher, fonctionne bien
- ✅ **Structure HTML** : Propre et bien organisée
- ✅ **Alpine.js patterns** : Bien utilisés, à préserver

### Phase 2 : Restructuration (4 semaines)
*Refactoring structurel avec changements d'architecture*

#### Semaines 3-4
- [ ] **State Management centralisé** (1 semaine)
  - Implémenter un store Alpine.js global
  - Migrer les états partagés (profils, session)
  - Estimation : 40h

- [ ] **Modularisation ES6** (1 semaine)
  - Convertir tous les fichiers en modules ES6
  - Configurer bundler (Vite recommandé)
  - Estimation : 40h

#### Semaines 5-6
- [ ] **API Client abstrait** (3 jours)
  - Créer classe ApiClient avec versioning
  - Centraliser la gestion d'erreurs
  - Estimation : 24h

- [ ] **Refactoring des composants** (1 semaine)
  - Découper les gros composants (roll.js = 500+ lignes)
  - Créer des mixins réutilisables
  - Estimation : 40h

**Total Phase 2 : 144h (2 développeurs)**

### Phase 3 : Optimisation (4 semaines)
*Améliorations de performance et qualité*

#### Semaines 7-8
- [ ] **Tests unitaires** (1 semaine)
  - Jest pour logique métier JavaScript
  - Tests sur tous les calculs critiques
  - Estimation : 40h

- [ ] **Tests E2E** (1 semaine)
  - Cypress pour workflows principaux
  - Tests de non-régression automatisés
  - Estimation : 40h

#### Semaines 9-10
- [ ] **Optimisation des performances** (1 semaine)
  - Lazy loading des composants
  - Debounce sur watchers fréquents
  - Service Worker pour cache offline
  - Estimation : 40h

- [ ] **Monitoring et métriques** (1 semaine)
  - Intégrer Sentry pour tracking d'erreurs
  - Performance monitoring avec Web Vitals
  - Estimation : 40h

**Total Phase 3 : 160h (2 développeurs)**

## 📈 Planning et Ressources

### Calendrier Proposé
- **Phase 1** : Janvier 2025 (S3-S4)
- **Phase 2** : Février 2025
- **Phase 3** : Mars 2025

### Ressources Nécessaires
- 2 développeurs frontend senior
- 1 développeur backend (support API)
- 1 QA pour tests de régression

### Budget Estimé
- **Développement** : 384h × 75€/h = 28,800€
- **Tests & QA** : 80h × 60€/h = 4,800€
- **Formation** : 2,000€
- **Total** : ~36,000€

## ✅ Critères de Validation par Phase

### Phase 1
- [ ] 0 duplication dans les validations
- [ ] Tous les événements passent par event-bus
- [ ] 100% des fonctions publiques documentées

### Phase 2
- [ ] State centralisé fonctionnel
- [ ] Build time < 30s
- [ ] 0 dépendance circulaire

### Phase 3
- [ ] Coverage > 70%
- [ ] Performance score > 90
- [ ] 0 erreur Sentry sur 1 semaine

## 🔄 Approche de Migration Sécurisée

### Principe : "Extraire sans Casser"
1. **Identifier** la duplication réelle (pas les faux positifs)
2. **Extraire** la logique pure dans des modules
3. **Wrapper** dans les composants pour garder le contexte Alpine
4. **Tester** exhaustivement avant de passer au suivant
5. **Valider** avec l'utilisateur à chaque étape

### Tests de Non-Régression Critiques
```javascript
// Cas à tester pour validation numérique
- Saisie avec virgule : "12,5" → "12.5"
- Saisie avec point : "12.5" → "12.5"
- Point seul : ".5" → "0.5"
- Virgule seule : ",5" → "0.5"
- Caractères interdits : bloqués
- Copier-coller : formaté correctement
- Blur vide : pas d'erreur
- Chaînage @blur : updateMicrometry() appelé
```

## 📚 Prochaines Étapes

1. **Validation du plan** avec l'équipe
2. **POC sur un composant** (quality-control recommandé)
3. **Formation de l'équipe** sur nouveaux patterns
4. **Démarrage Phase 1** avec extraction des constantes

## 📝 Résumé des Vraies Duplications à Traiter

### Duplications Confirmées (à refactorer)
1. **Validation numérique** : 12+ occurrences dans quality-control, roll
2. **Calculs de moyennes** : 4+ duplications entre templates et JS
3. **Gestion events** : window.addEventListener dans 15+ endroits
4. **Formatage timestamps** : Logique répétée

### Faux Positifs (à NE PAS refactorer)
1. **Session loading** : api.js déjà centralisé, composants l'utilisent bien
2. **Valeur < 5** : Fallback de sécurité légitime
3. **Patterns Alpine** : x-data, x-show bien utilisés

## 🎯 Bénéfices Attendus Réalistes

- **Code** : -25% de duplication (pas -40%)
- **Maintenance** : Logique métier isolée et testable
- **Stabilité** : Zéro régression grâce aux wrappers
- **Évolutivité** : Ajout de features facilité

---

*Document mis à jour le 20/01/2025 - Basé sur analyse réelle du code*