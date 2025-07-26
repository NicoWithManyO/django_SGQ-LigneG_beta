# Guide Technique SGQ Ligne G

## 🏗️ Architecture

### Stack
- **Backend**: Django 5.2.4 + Django REST Framework 3.15.2
- **Frontend**: Django Templates + Alpine.js 3.x
- **CSS**: Bootstrap 5.3 + Variables CSS custom
- **Base de données**: SQLite (dev) / PostgreSQL (prod)

### Organisation Django Apps
```
catalog/        # Données référence (profils, specs, défauts)
production/     # Gestion postes et rouleaux  
quality/        # Contrôles qualité et mesures
wcm/           # World Class Manufacturing + TRS
planification/ # Opérateurs et ordres fabrication
livesession/   # Persistance formulaires
frontend/      # Interface utilisateur
management/    # Supervision production et reporting
exporting/     # Export Excel des données production
```

## 🚨 Règles Critiques

### Convention Absolue
**CODE EN ANGLAIS, COMMENTAIRES EN FRANÇAIS**

### IDs Auto-générés (NE JAMAIS MODIFIER)
```python
# Format Opérateur
employee_id = "PrenomNOM"  # Ex: "MartinDUPONT"

# Format Poste  
shift_id = "JJMMAA_PrenomNom_Vacation"  # Ex: "220725_MartinDupont_Matin"

# Format Rouleau
roll_id = "OF_NumRouleau"  # Ex: "3249_001"
```

### Naming Standards
- **Python**: `snake_case` / `PascalCase` (classes)
- **JavaScript**: `camelCase` / `PascalCase` (classes)  
- **CSS/Fichiers**: `kebab-case`

## 💾 Système de Session

### Concept
Sauvegarde automatique de tous les formulaires → Restauration après refresh

### API Session
```javascript
// Charger
const data = await api.getSession();

// Sauvegarder (avec debounce 300ms)
await api.saveToSession({ 
    my_field: value 
});
```

### Ajouter un Champ
1. Déclarer dans `livesession/serializers.py`
2. Ajouter dans `frontend/views.py` (session_data)
3. Utiliser dans le composant JS

## 🎯 Architecture Frontend

### Structure Composant
```
templates/components/[name].html  # Template Django
static/js/[name].js              # Logique Alpine.js
static/css/[name].css            # Styles
```

### Communication Événements
```javascript
// Émettre
window.dispatchEvent(new CustomEvent('profile-changed', {
    detail: { profile: profileData }
}));

// Écouter
window.addEventListener('profile-changed', (e) => {
    this.updateProfile(e.detail.profile);
});
```

### Événements Principaux
- `profile-changed` → Met à jour spécifications
- `target-length-changed` → Ajuste grille rouleau
- `quality-control-updated` → Validation conformité
- `roll-updated` → Met à jour compteurs
- `shift-saved` / `roll-saved` → Succès sauvegarde

## 📐 Patterns Importants

### Composant Alpine.js Type
```javascript
function myComponent() {
    return {
        // État
        myField: '',
        
        // Init
        init() {
            this.loadFromSession();
            this.initAutoSave(['myField']);
            
            // Écouter événements
            window.addEventListener('some-event', (e) => {
                this.handleEvent(e.detail);
            });
        },
        
        // Charger session
        loadFromSession() {
            if (window.sessionData?.my_field) {
                this.myField = window.sessionData.my_field;
            }
        },
        
        // Auto-save avec debounce
        async saveToSession() {
            await api.saveToSession({
                my_field: this.myField
            });
        }
    };
}
```

### Validation Progressive
```javascript
// Vérifier avant de permettre l'étape suivante
validateForm() {
    this.isValid = 
        this.hasRequiredFields() &&
        this.qcStatus !== 'pending' &&
        this.checklistSigned;
}
```

## 🔌 Routes API

### Production
- `POST /api/production/shifts/` - Créer un poste
- `POST /api/production/rolls/` - Créer un rouleau

### Données Référence  
- `GET /api/profiles/` - Profils production
- `GET /api/defect-types/` - Types de défauts
- `GET /api/lost-time-reasons/` - Motifs temps perdu

### Session
- `GET/PATCH /api/session/` - Gestion session

### Management
- `GET /management/` - Dashboard supervision
- `GET /management/api/dashboard-stats/` - Statistiques temps réel
- `POST /management/api/checklists/{id}/sign/` - Viser checklist

## 🔄 Workflow Type

1. **Page Load**: Charger données référence + session
2. **User Input**: Alpine.js capture les changements
3. **Auto-save**: Debounce 300ms → Session API
4. **Validation**: Temps réel selon règles métier
5. **Submit**: Consolidation données → POST API
6. **Success**: Clear session + reload page

## 📏 Règles Métier Clés

### Épaisseurs Rouleau
- < 3m : Mesure à 1m
- ≥ 3m : Mesures à 3m puis tous les 5m (3, 8, 13, 18...)

### Conformité Rouleau
```
Conforme SI:
- Aucun défaut bloquant ET
- Cellules NOK ≤ seuil défaut "Épaisseur" ET  
- Contrôle qualité != 'failed' ET
- (Si QC pending: première ligne épaisseur complète)
```

### Types Défauts
- **Bloquant** (rouge): Arrêt production immédiat
- **Non-bloquant** (orange): Production continue
- **Avec seuil** (orange→rouge): Bloquant après X occurrences

### Calcul TRS (OEE)
```
Disponibilité = (Temps Disponible / Temps Ouverture) × 100
Performance = (Production Réelle / Production Théorique) × 100
Qualité = (Production OK / Production Totale) × 100
TRS = (Disponibilité × Performance × Qualité) / 10000
```
- Calculé à la sauvegarde du poste
- Utilise la vitesse réelle du profil de production
- Stocké dans le modèle TRS pour reporting

## 🛠️ Développement

### Ajouter une Fonctionnalité
1. Créer composant (HTML/JS/CSS)
2. Ajouter champs session si nécessaire
3. Implémenter logique Alpine.js
4. Connecter aux événements existants
5. Tester auto-save et restauration

### Debug Session
```javascript
// Console navigateur
window.sessionData  // Voir toutes les données
api.saveToSession({test: 123})  // Tester save
```

### Commits
Format: `type(scope): description`
- `feat`: Nouvelle fonctionnalité
- `fix`: Correction bug
- `refactor`: Refactoring code
- `docs`: Documentation

---

💡 **L'essentiel**: Respecter les conventions, utiliser le système de session pour la persistance, et communiquer entre composants via événements custom.