# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Workflow de commit assisté

- Lorsque je tape "+commit", je vérifie automatiquement les conventions de code et la qualité du code
- Je prépare un message de commit concis, en anglais, sans préfixe textuel
- Le message de commit inclut un résumé des modifications depuis le dernier commit
- L'objectif est de faciliter la copie du message de commit pour l'utilisateur

## Common Development Commands

```bash
# Development server
python manage.py runserver      # Start at http://127.0.0.1:8000/

# Database management
python manage.py makemigrations # Create new migrations
python manage.py migrate        # Apply migrations to database
python manage.py showmigrations # Check migration status

# User management
python manage.py createsuperuser # Create admin user for /admin/

# Django shell
python manage.py shell          # Interactive Python shell with Django context

# Testing (basic Django tests exist but no test framework configured)
python manage.py test          # Run all tests
python manage.py test catalog  # Run tests for specific app

# Linting/formatting commands to run before commit
# npm run lint      # If configured
# npm run typecheck # If configured
# ruff             # Python linter if available
```

## Project Architecture

### High-Level Overview
Production management system for fiber optics manufacturing with real-time quality control, traceability, and ISO compliance. The system uses Django backend with Alpine.js frontend for reactive UI without a build process.

### Critical Business Logic Flow
1. **Operator logs in** → Auto-generated shift ID (`DDMMYY_FirstnameLast_Vacation`)
2. **Production starts** → Checklist validation required before any production
3. **Roll creation** → Thickness measurements at specific intervals (1m if <3m, then 3m + every 5m)
4. **Real-time validation** → Colors indicate status (Green=OK, Orange=Alert, Red=NOK)
5. **Conformity decision** → Automatic based on defects, thickness NOK count, and QC status
6. **Session persistence** → All data auto-saved every 300ms, restored on refresh
7. **Final save** → Session data transferred to database with @transaction.atomic

### Critical Auto-Generated IDs (NEVER MODIFY)

These ID generation patterns are business-critical and must never be changed:

```python
# Operator.employee_id: "FirstnameLastname" format
self.employee_id = f"{self.first_name}{self.last_name.upper()}"

# Shift.shift_id: "DDMMYY_FirstnameLast_Vacation" format  
self.shift_id = f"{date_str}_{operator_name}_{self.vacation}"

# Roll.roll_id: "OF_RollNumber" format
self.roll_id = f"{self.fabrication_order.of_number}_{self.roll_number}"
```

### Session Management Architecture
The `livesession` app provides automatic form persistence:
- Frontend components debounce changes (300-500ms) before saving
- Session API (`/api/session/`) stores data temporarily
- On final save, session data is validated and transferred to database models
- Session is cleared after successful database save

### Event-Driven Frontend Communication
Components communicate via custom events instead of direct coupling:
```javascript
// Component A emits
window.dispatchEvent(new CustomEvent('roll-created', { 
    detail: { rollId: response.data.id }
}));

// Component B listens
window.addEventListener('roll-created', (e) => {
    this.updateRollDisplay(e.detail.rollId);
});
```

Key events:
- `profile-changed` → Updates specifications across components
- `target-length-changed` → Adjusts roll grid size
- `quality-control-updated` → Updates conformity status
- `roll-updated` → Updates counters and badges
- `shift-saved` / `roll-saved` → Triggers success UI state

## Code Conventions

### Fundamental Rule
**All code must be in English, only comments are in French**

### Naming Standards
- **Python**: snake_case for functions/variables, PascalCase for classes
- **JavaScript**: camelCase for functions/variables, PascalCase for classes
- **CSS**: kebab-case for all classes
- **Files**: kebab-case for all filenames

### Commit Messages
Follow conventional format in English:
```
type(scope): description

Types: feat, fix, refactor, docs, style, test, chore
```

## Critical Business Rules

### Thickness Measurement Logic
```python
# Row 1: 1m (if length < 3m)
# Row 3: 3m (if length >= 3m)
# Then every 5m: 8m, 13m, 18m, etc.
if targetLength < 3:
    return row === 1
return row === 3 or (row > 3 and (row - 3) % 5 === 0)
```

### Roll Conformity Rules
A roll is **NON-CONFORM** if:
- Has any blocking defect (severity='blocking')
- NOK thickness count exceeds defect threshold
- Quality control status is 'failed'
- QC is 'pending' AND first thickness row is incomplete

### Defect Severity Levels
- **blocking** (red): Stops production immediately, shows scissors animation
- **non_blocking** (orange): Tracked but production continues
- **threshold** (orange→red): Becomes blocking after N occurrences

## Common Pitfalls to Avoid

1. **Never modify ID generation logic** - External systems depend on exact formats
2. **Don't skip session saves** - Users expect zero data loss
3. **Maintain keyboard navigation** - Required for production floor usage
4. **Keep components loosely coupled** - Use events, not direct references
5. **Preserve French comments** - Team documentation requirement
6. **Always use @transaction.atomic** for multi-model saves
7. **Test with both comma and dot** for decimal inputs

## Key File Locations

- **Technical documentation**: `docs/TECHNICAL_GUIDE.md`
- **Session fields definition**: `livesession/serializers.py`
- **Frontend components**: `frontend/static/js/` and `frontend/templates/components/`
- **Business logic**: Service classes in each app's `services.py`
- **API endpoints**: Each app's `api_views.py` and `urls.py`

## Bootstrap Integration Note

- Utilise en priorité des composants Bootstrap intégrés
- Consulte la doc Bootstrap 5.3 avant de créer des composants custom
- Ne pas réinventer la roue quand Bootstrap fournit déjà la fonctionnalité