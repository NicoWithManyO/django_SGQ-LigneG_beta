# Conventions de code - SGQ Ligne G

Ce document définit les conventions de code à respecter pour le développement du projet SGQ Ligne G.

## 🌐 Règle fondamentale

**Tout le code doit être en anglais, seuls les commentaires sont en français.**

Cette règle s'applique à :
- Variables, fonctions, classes, méthodes
- Noms de fichiers et dossiers
- Messages de commit Git
- Documentation technique (sauf ce fichier)

## 🐍 Python/Django

### Standards généraux
- **PEP 8** : Respect strict des standards Python
  - Indentation : 4 espaces (jamais de tabs)
  - Longueur de ligne : maximum 79 caractères
  - Imports organisés : standard library, third-party, local

### Conventions Django
- **Models** : Noms au singulier en anglais
  ```python
  class Operator(models.Model):  # ✅ Correct
  class Operators(models.Model): # ❌ Incorrect
  ```

- **Apps** : Noms au pluriel ou fonctionnels en anglais
  ```
  production/     # ✅ Correct
  quality/        # ✅ Correct  
  planification/  # ❌ Incorrect (français)
  ```

- **Vues** : Utiliser les Class-Based Views quand pertinent
  ```python
  class ShiftListView(ListView):    # ✅ CBV
  def shift_list(request):          # ✅ FBV simple
  ```

### Documentation et commentaires
```python
def calculate_trs(production_time, total_time):
    """
    Calculate the Overall Equipment Effectiveness (OEE/TRS).
    
    Args:
        production_time: Temps de production effectif en minutes
        total_time: Temps total disponible en minutes
    
    Returns:
        float: TRS en pourcentage
    """
    # Vérifier que les temps sont valides
    if total_time <= 0:
        return 0
    
    # Calculer le TRS
    trs = (production_time / total_time) * 100
    return round(trs, 2)
```

### Nommage des variables
```python
# ✅ Correct
target_length = 12
thickness_values = []
defect_count = 0

# ❌ Incorrect
longueur_cible = 12
valeurs_epaisseur = []
nb_defauts = 0
```

## 📝 JavaScript

### Standards généraux
- **ES6+** : Utiliser const/let, arrow functions, destructuring
- **camelCase** : Pour les variables et fonctions
- **PascalCase** : Pour les constructeurs et classes
- **SCREAMING_SNAKE_CASE** : Pour les constantes

### Alpine.js
```javascript
// ✅ Correct
function shiftForm() {
    return {
        // État
        operatorId: '',
        shiftDate: '',
        vacation: '',
        
        // Méthodes
        async saveToSession() {
            // Sauvegarder en session
            const response = await fetch('/api/session/', {
                method: 'PATCH',
                // ...
            });
        }
    };
}

// ❌ Incorrect
function fichePoste() {
    return {
        operateurId: '',
        datePoste: '',
        // ...
    };
}
```

### Organisation des fichiers
- Un fichier JS par composant
- Nom du fichier = nom du composant en kebab-case
```
shift-form.js       # ✅ Correct
production-order.js # ✅ Correct
fiche-poste.js      # ❌ Incorrect (français)
```

## 🎨 CSS

### Conventions de nommage
- **kebab-case** : Pour toutes les classes CSS
- **BEM optionnel** : Pour les composants complexes
- **Préfixes fonctionnels** : Pour clarifier l'usage

```css
/* ✅ Correct */
.shift-form { }
.roll-grid { }
.thickness-input { }
.defect-indicator { }

/* ❌ Incorrect */
.fichePoste { }
.grilleRouleau { }
.inputEpaisseur { }
```

### Organisation des fichiers
```
css/
├── base.css           # Reset et styles globaux
├── components.css     # Composants réutilisables
├── layout.css         # Structure et grille
├── shift-form.css     # ✅ Styles spécifiques
├── roll-zone.css      # ✅ Styles spécifiques
└── fiche-poste.css    # ❌ Incorrect (français)
```

### Variables CSS
```css
:root {
    /* Couleurs principales */
    --primary-blue: #215c98;
    --secondary-gray: #9da1a8;
    --light-blue: #dae9f8;
    
    /* Espacements */
    --spacing-small: 0.5rem;
    --spacing-medium: 1rem;
    --spacing-large: 2rem;
}
```

## 📁 Structure et nommage des fichiers

### Templates Django
```
templates/
├── components/
│   ├── shift-form.html      # ✅ Correct
│   ├── production-order.html # ✅ Correct
│   └── navbar.html          # ✅ Correct
└── pages/
    ├── production.html      # ✅ Correct
    └── index.html          # ✅ Correct
```

### Règles générales
- **kebab-case** pour tous les fichiers
- **Anglais uniquement** pour les noms
- **Extensions explicites** (.js, .css, .html)

## 🔤 Traductions et textes affichés

Les textes affichés à l'utilisateur peuvent être en français :
```html
<!-- ✅ Correct : texte affiché en français, attributs en anglais -->
<label class="form-label">Opérateur</label>
<button class="btn btn-primary">Enregistrer</button>

<!-- ❌ Incorrect : attributs en français -->
<label class="libelle-formulaire">Opérateur</label>
```

## 📊 Base de données

### Noms de tables et colonnes
- Django génère automatiquement les noms de tables
- Les noms de champs doivent être en anglais

```python
# ✅ Correct
class Roll(models.Model):
    roll_id = models.CharField(max_length=50)
    target_length = models.IntegerField()
    actual_length = models.IntegerField()
    
# ❌ Incorrect
class Rouleau(models.Model):
    id_rouleau = models.CharField(max_length=50)
    longueur_cible = models.IntegerField()
```

## 🚫 IDs auto-générés - NE JAMAIS MODIFIER

Les logiques de génération d'IDs suivantes sont critiques et ne doivent JAMAIS être modifiées :

### Operator.employee_id
Format : `PrenomNOM`
```python
# Dans Operator.save() - NE PAS TOUCHER
self.employee_id = f"{self.first_name}{self.last_name.upper()}"
```

### Shift.shift_id
Format : `JJMMAA_PrenomNom_Vacation`
```python
# Dans Shift.save() - NE PAS TOUCHER
date_str = self.date.strftime('%d%m%y')
operator_name = f"{self.operator.first_name}{self.operator.last_name}"
self.shift_id = f"{date_str}_{operator_name}_{self.vacation}"
```

### Roll.roll_id
Format : `OF_NumRouleau` ou `ROLL_YYYYMMDD_HHMMSS`
```python
# Dans Roll.save() - NE PAS TOUCHER
if self.fabrication_order:
    self.roll_id = f"{self.fabrication_order.of_number}_{self.roll_number}"
else:
    timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
    self.roll_id = f"ROLL_{timestamp}"
```

## 💬 Messages de commit

Les messages de commit doivent être en anglais et suivre ce format :
```
type(scope): description

- feat: nouvelle fonctionnalité
- fix: correction de bug
- refactor: refactoring de code
- docs: documentation
- style: formatage, missing semi colons, etc
- test: ajout ou correction de tests
- chore: maintenance
```

Exemples :
```bash
feat(roll): add dynamic grid adaptation to target length
fix(thickness): correct validation logic for NOK values
refactor(frontend): rename all French variables to English
docs(conventions): add coding standards documentation
```

## ✅ Checklist de validation

Avant chaque commit, vérifier :
- [ ] Tous les noms de variables sont en anglais
- [ ] Tous les noms de fonctions/méthodes sont en anglais
- [ ] Tous les noms de fichiers sont en anglais et kebab-case
- [ ] Les commentaires sont en français et pertinents
- [ ] Le code respecte PEP 8 (Python) ou les standards JS
- [ ] Les IDs auto-générés n'ont pas été modifiés
- [ ] Le message de commit est en anglais et suit le format

## 🔧 Outils recommandés

### Linters et formatters
- **Python** : `ruff`, `black`, `isort`
- **JavaScript** : `eslint`, `prettier`
- **CSS** : `stylelint`

### Configuration VS Code
```json
{
    "editor.formatOnSave": true,
    "python.linting.enabled": true,
    "python.linting.ruffEnabled": true,
    "eslint.enable": true
}
```

## 📚 Ressources

- [PEP 8 - Style Guide for Python Code](https://www.python.org/dev/peps/pep-0008/)
- [Django Coding Style](https://docs.djangoproject.com/en/dev/internals/contributing/writing-code/coding-style/)
- [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- [CSS Guidelines](https://cssguidelin.es/)