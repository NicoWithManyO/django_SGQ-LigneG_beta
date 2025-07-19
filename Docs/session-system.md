# Système de gestion des sessions - SGQ Ligne G

## Vue d'ensemble

Le système utilise une architecture de session persistante qui permet de sauvegarder automatiquement les données saisies par l'utilisateur sans nécessiter de soumission de formulaire.

## Architecture

### 1. Backend (Django)

#### API Session (`/api/session/`)
- **Endpoint**: `livesession/views.py` - `SessionAPIView`
- **Méthodes**: GET (récupérer) et PATCH (mettre à jour)
- **Serializer**: `livesession/serializers.py` - `SessionSerializer`

#### Flux de données
1. Les données sont stockées dans `request.session` (session Django)
2. Le serializer valide et transforme les données
3. Les dates/heures sont converties en string pour la session
4. `None` supprime la clé de la session

### 2. Frontend (JavaScript)

#### API Client (`common.js`)
```javascript
api.saveToSession(data)  // Sauvegarde dans la session
api.getSession()         // Récupère toute la session
```

#### Pattern d'utilisation dans les composants
```javascript
// 1. Charger depuis la session au démarrage
loadFromSession() {
    if (window.sessionData?.my_field) {
        this.myField = window.sessionData.my_field;
    }
}

// 2. Sauvegarder dans la session
async saveToSession(data) {
    await api.saveToSession({
        my_field: this.myField
    });
}

// 3. Écouter les changements de session
window.addEventListener('session-changed', () => {
    this.loadFromSession();
});
```

### 3. Intégration dans les vues Django

Dans `frontend/views.py`:
```python
session_data = {
    'field_name': request.session.get('field_name', ''),
    'json_field': request.session.get('json_field', {}),
    # ... autres champs
}
context = {
    'session_data': json.dumps(session_data),
}
```

Dans le template:
```html
<script>
window.sessionData = {{ session_data|safe }};
</script>
```

## Champs disponibles dans la session

### Données du poste
- `shift_id`, `operator_id`, `shift_date`, `vacation`
- `start_time`, `end_time`
- `machine_started`, `machine_stopped`

### Ordre de fabrication
- `of_en_cours`, `target_length`, `of_decoupe`

### Données du rouleau
- `roll_number`, `tube_mass`, `roll_length`, `total_mass`
- `roll_data` (JSON): épaisseurs, défauts, etc.

### Checklist
- `checklist_responses` (JSON): réponses aux items
- `checklist_signature`, `checklist_signature_time`

## Points d'attention

### 1. Ajout d'un nouveau champ

Pour ajouter un champ à la session:

1. **Ajouter dans le serializer** (`livesession/serializers.py`):
```python
my_new_field = serializers.CharField(required=False, allow_null=True)
```

2. **Ajouter dans la vue** (`frontend/views.py`):
```python
'my_new_field': request.session.get('my_new_field', ''),
```

3. **Utiliser dans le JS**:
```javascript
// Sauvegarder
await api.saveToSession({ my_new_field: value });

// Charger
this.myField = window.sessionData?.my_new_field || '';
```

### 2. Types de données

- **String/Number**: Utiliser `CharField` dans le serializer
- **Boolean**: Utiliser `BooleanField`
- **JSON/Object**: Utiliser `JSONField`
- **Date**: Utiliser `DateField` (converti en ISO string)
- **Time**: Utiliser `TimeField` (converti en HH:MM)

### 3. Nommage des champs

- **IMPORTANT**: Utiliser des noms en anglais (pas de `longueur_cible`, utiliser `target_length`)
- Les noms doivent correspondre entre le serializer, la vue et le JS

### 4. Persistance vs Base de données

- La session stocke les données **temporairement**
- La validation finale du poste sauvegarde en **base de données**
- Les check-lists sont stockées en JSON dans la session, puis créées en BDD à la validation

## Debugging

Pour voir le contenu de la session:
```javascript
// Dans la console du navigateur
console.log(window.sessionData);

// Ou via l'API
api.getSession().then(data => console.log(data));
```

Pour vérifier côté Django:
```python
# Dans une vue ou le shell Django
print(request.session.items())
```