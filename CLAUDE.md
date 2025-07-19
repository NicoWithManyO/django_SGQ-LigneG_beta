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
```

## Project Architecture

### Technology Stack
- **Backend**: Django 5.2.4 with Django REST Framework 3.15.2
- **Frontend**: Server-side rendered Django templates with Alpine.js 3.x for reactivity
- **CSS**: Bootstrap 5.3 with custom CSS variables, no build process required
- **Database**: SQLite for development, PostgreSQL recommended for production

### Django Apps Organization

1. **catalog/** - Reference data foundation (models that other apps depend on)
   - Product profiles with material specifications (thickness, micronaire, etc.)
   - Machine parameters and temperature settings
   - Defect types catalog with severity levels
   - WCM checklist templates

2. **production/** - Core production management
   - Shift management with auto-generated IDs
   - Roll tracking with full traceability
   - Current production state and active orders
   - Links to quality controls and defects

3. **quality/** - Quality control and assurance
   - Quality control records with 12x7 grid validation
   - Roll defects tracking with timestamps
   - Thickness measurements with real-time validation
   - NOK (non-conforming) product management

4. **wcm/** - World Class Manufacturing operations
   - Lost time tracking with categorization
   - Dynamic checklists based on production profiles
   - Machine parameters history and auditing
   - Performance metrics calculation

5. **planification/** - Planning and resource management
   - Operator management with unique employee IDs
   - Fabrication orders (OF) scheduling
   - Production planning interfaces

6. **livesession/** - Session state persistence
   - Automatic form data saving via REST API
   - Cross-component state management
   - Session recovery after page refresh

7. **frontend/** - User interface layer
   - Component-based architecture (one HTML/JS/CSS per component)
   - Alpine.js for client-side reactivity
   - Session API integration for data persistence
   - Advanced UI features (keyboard navigation, visual indicators)

### Critical Auto-Generated IDs (NEVER MODIFY)

These ID generation patterns are business-critical and must never be changed:

```python
# Operator.employee_id: "FirstnameLastname" format
self.employee_id = f"{self.first_name}{self.last_name.upper()}"

# Shift.shift_id: "DDMMYY_FirstnameLast_Vacation" format  
self.shift_id = f"{date_str}_{operator_name}_{self.vacation}"

# Roll.roll_id: "OF_RollNumber" or "ROLL_TIMESTAMP" format
self.roll_id = f"{self.fabrication_order.of_number}_{self.roll_number}"
```

### Frontend Component Architecture

Each UI component follows this structure:
```
frontend/templates/components/[component-name].html  # Django template
frontend/static/js/[component-name].js              # Alpine.js component
frontend/static/css/[component-name].css            # Component styles
```

Components communicate through:
- Session API (`/api/session/`) for state persistence
- Alpine.js x-data for local state
- Custom events for cross-component communication

### Key UI Features

1. **Roll Zone Grid**: 12x7 thickness measurement grid with:
   - Keyboard navigation (Tab/Shift+Tab)
   - Auto-selection on focus
   - Real-time validation against specifications
   - Visual indicators for OK/NOK values
   - Automatic session saving

2. **Dynamic Checklists**: Profile-specific validation checklists
   - Required completion before production start
   - Mandatory comments for non-conforming items
   - Full audit trail preservation

3. **Lost Time Tracking**: Categorized downtime recording
   - Predefined categories from WCM standards
   - Real-time TRS (OEE) calculation
   - Historical analysis capabilities

## Code Conventions (from Docs/conventions.md)

### Fundamental Rule
**All code must be in English, only comments are in French**

### Naming Standards
- **Python**: snake_case for functions/variables, PascalCase for classes
- **JavaScript**: camelCase for functions/variables, PascalCase for classes
- **CSS**: kebab-case for all classes
- **Files**: kebab-case for all filenames

### Django Specific
- Models: Singular names (e.g., `Operator`, not `Operators`)
- Apps: Plural or functional names (e.g., `production`, `quality`)
- Use Class-Based Views when appropriate

### Commit Messages
Follow conventional format in English:
```
type(scope): description

Types: feat, fix, refactor, docs, style, test, chore
```

## API Endpoints

Main endpoints:
- `/admin/` - Django admin interface
- `/api/session/` - Session state management
- `/api/` - REST API root (DRF browsable API)

## Development Notes

### Missing Infrastructure
- No explicit requirements.txt or dependency management file
- No configured test framework beyond basic Django tests
- No linting/formatting configuration
- No CI/CD pipeline

### Environment Setup
Currently using Django's default development settings with:
- DEBUG = True
- SQLite database
- No environment variable configuration

### Best Practices for This Codebase
1. Always check existing patterns in similar components before creating new ones
2. Use the session API for any form data that should persist
3. Follow the established ID generation patterns exactly
4. Maintain the French comments for team documentation
5. Test with keyboard navigation for accessibility
6. Verify against the three ISO standards (9001, 14001, 45001) for compliance features