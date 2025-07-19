# Patterns Architecturaux - SGQ Ligne G

Ce document décrit les patterns de communication et d'architecture utilisés dans le projet.

## 📡 Communication BDD → Frontend

### 1. API REST Django
Le backend expose des endpoints REST via Django REST Framework :

```python
# Exemple : catalog/views.py
class QualityDefectTypeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = QualityDefectType.objects.filter(is_active=True)
    serializer_class = QualityDefectTypeSerializer
```

### 2. Serializers
Les serializers transforment les modèles Django en JSON :

```python
# catalog/serializers.py
class QualityDefectTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = QualityDefectType
        fields = ['id', 'name', 'description', 'severity', 'threshold_value', 'is_active']
```

### 3. Chargement côté Frontend
Le frontend charge les données via `data-loader.js` :

```javascript
// Chargement avec cache
async loadDefectTypes() {
    const response = await fetch('/api/defect-types/');
    if (response.ok) {
        this.cache.defectTypes = await response.json();
        return this.cache.defectTypes;
    }
}
```

## 🔄 Updates Live Frontend

### 1. Alpine.js Reactivity
Les composants Alpine.js utilisent la réactivité pour les mises à jour :

```javascript
// Composant avec état réactif
function roll() {
    return {
        defects: [],        // État réactif
        defectCount: 0,     // Calculé automatiquement
        
        addDefect() {
            this.defects.push(defect);
            this.defectCount = this.defects.length;  // Mise à jour automatique
        }
    }
}
```

### 2. Événements Custom
Communication entre composants via événements :

```javascript
// Émetteur
window.dispatchEvent(new CustomEvent('rouleau-updated', {
    detail: { 
        defectCount: this.defectCount,
        nokCount: this.nokCount
    }
}));

// Récepteur
window.addEventListener('rouleau-updated', (e) => {
    this.updateBadges(e.detail);
});
```

### 3. Watchers Alpine.js
Surveillance des changements de données :

```javascript
this.$watch('targetLength', () => {
    this.updateGrid();  // Réaction au changement
});
```

## 💾 Session Persistante

### 1. API Session
L'API `livesession` gère la persistance temporaire :

```python
# livesession/views.py
class SessionViewSet(viewsets.GenericViewSet):
    def update(self, request):
        # Fusion des données existantes avec les nouvelles
        for key, value in request.data.items():
            request.session[key] = value
        return Response(request.session.get_decoded())
```

### 2. Sauvegarde Automatique
Les composants sauvegardent automatiquement :

```javascript
// api.js
async saveToSession(data) {
    const response = await fetch('/api/session/', {
        method: 'PUT',
        body: JSON.stringify(data)
    });
    return response.json();
}

// Utilisation dans un composant
async saveRollData() {
    await api.saveToSession({ 
        roll_data: {
            thicknesses: this.thicknesses,
            defects: this.defects
        }
    });
}
```

### 3. Rechargement au Démarrage
Les données sont restaurées depuis la session :

```javascript
init() {
    this.loadFromSession();  // Charge les données sauvegardées
}

loadFromSession() {
    if (window.sessionData?.roll_data) {
        this.thicknesses = window.sessionData.roll_data.thicknesses || [];
        this.defects = window.sessionData.roll_data.defects || [];
    }
}
```

## 📤 Communication Frontend → BDD (Pattern)

### 1. Validation Finale
Lors de la validation d'un poste, les données de session sont transférées en BDD :

```javascript
// Exemple conceptuel
async validateShift() {
    // 1. Récupérer toutes les données de session
    const sessionData = await api.getSession();
    
    // 2. Créer l'objet shift complet
    const shiftData = {
        ...sessionData.shift_form,
        rolls: sessionData.rolls,
        quality_controls: sessionData.quality_data
    };
    
    // 3. Envoyer en BDD
    const response = await api.post('/api/shifts/', shiftData);
    
    // 4. Nettoyer la session après succès
    if (response.ok) {
        await api.clearSession();
    }
}
```

### 2. Transactions Atomiques
Utiliser les transactions Django pour garantir l'intégrité :

```python
from django.db import transaction

@transaction.atomic
def create_shift_with_data(self, validated_data):
    # Toutes les créations dans une transaction
    shift = Shift.objects.create(...)
    for roll_data in validated_data['rolls']:
        Roll.objects.create(shift=shift, ...)
```

## 🎨 Patterns UI/UX

### 1. Indicateurs Visuels Dynamiques
Classes CSS conditionnelles avec Alpine.js :

```html
<div class="defect-indicator" 
     :class="getDefectSeverityClass(row, col)">
```

```javascript
getDefectSeverityClass(row, col) {
    const defect = this.defects.find(d => d.row === row && d.col === col);
    return (defect?.severity === 'non_blocking' || defect?.severity === 'threshold') 
        ? 'non-blocking' 
        : '';
}
```

### 2. Animations Conditionnelles
Animations CSS déclenchées par l'état :

```css
/* Animation seulement pour défauts bloquants */
tr.has-defect td::after {
    content: "✂";
    animation: scissorCut 0.6s ease-out;
}
```

### 3. Compteurs Dynamiques
Affichage conditionnel de compteurs :

```html
<span x-show="getDefectCount(typeId) > 1" 
      class="defect-count" 
      x-text="getDefectCount(typeId)">
</span>
```

## 🔐 Bonnes Pratiques

### 1. Séparation des Responsabilités
- **Models** : Logique métier et validation
- **Serializers** : Transformation des données
- **Views** : Endpoints et permissions
- **Frontend Components** : État local et interactions
- **Business Logic** : Règles métier côté client

### 2. Performance
- Cache des données statiques (types de défauts, profils)
- Debounce sur les sauvegardes fréquentes
- Lazy loading des composants non critiques

### 3. Fiabilité
- Sauvegarde automatique en session
- Validation côté client ET serveur
- Gestion d'erreurs avec fallback

### 4. Maintenabilité
- Pas de duplication de code
- Fonctions utilitaires réutilisables
- Documentation des patterns complexes