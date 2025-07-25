# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SGQ Ligne G is a Production Quality Management System for the fiber optics industry, ensuring complete traceability, quality control, and performance optimization according to ISO 9001, 14001, and 45001 standards.

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

# Load initial reference data
python manage.py load_initial_data              # Load all reference data
python manage.py load_initial_data --clear      # Clear existing data first
python manage.py load_initial_data --dry-run    # Preview changes without applying

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
- **Backend**: Django 5.2.4 with Django REST Framework 3.16.0
- **Frontend**: Server-side rendered Django templates with Alpine.js 3.x for reactivity
- **CSS**: Bootstrap 5.3 with custom CSS variables, no build process required
- **Database**: SQLite

### Django Apps Organization

1. **catalog/** - Reference data foundation (models that other apps depend on)
   - Product profiles with material specifications (thickness, micronaire, etc.)
   - Machine parameters and temperature settings
   - Defect types catalog with severity levels
   - WCM checklist templates
   - Custom management command: `load_initial_data`

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
   - Performance metrics calculation (TRS/OEE)

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
- `/api/session/` - Session state management (GET/PATCH)
- `/api/` - REST API root (DRF browsable API)
- `/api/rolls/` - Roll CRUD operations
- `/api/shifts/` - Shift management
- `/api/lost-time-entries/` - WCM time tracking
- `/api/checklist-responses/` - Quality checklist responses

## Development Notes

### Best Practices for This Codebase
1. Always check existing patterns in similar components before creating new ones
2. Use the session API for any form data that should persist
3. Follow the established ID generation patterns exactly
4. Maintain the French comments for team documentation
5. Test with keyboard navigation for accessibility
6. Verify against the three ISO standards (9001, 14001, 45001) for compliance features
7. Bonne pratique : toujours vérifier les références avant de supprimer des fichiers, même s'ils semblent inutiles !

## Key Architectural Patterns

### Session Management Flow
1. Frontend components use Alpine.js with debounced auto-save (300ms)
2. Data is sent to `/api/session/` via PATCH requests
3. Session data is namespaced by component (e.g., `shift_form`, `roll_zone`)
4. On page load, components fetch their state from session
5. Final validation transfers session data to database models

### Event-Driven Frontend Communication
Components dispatch custom events for cross-component updates:
```javascript
// Example: Roll creation notifies other components
window.dispatchEvent(new CustomEvent('roll-created', { 
    detail: { rollId: response.data.id }
}));
```

### Validation Hierarchy
1. **Frontend validation**: Immediate feedback (Alpine.js)
2. **Session validation**: Data integrity checks
3. **Model validation**: Django model constraints
4. **Business validation**: Custom clean() methods

### Critical Business Rules
- **Defect Severity**: 
  - Blocking (red): Stops production immediately
  - Non-blocking (orange): Tracked but production continues
  - Threshold-based: Becomes blocking after N occurrences
- **Quality Control**: Must be completed before shift can be saved
- **Thickness Grid**: Values outside min/max are flagged as NOK
- **Machine State**: Must track if machine was on at start/end of shift
- **Thickness Measurements**: Taken at 1m for rolls <3m, every 5m for rolls ≥3m

## Frontend Component Dependencies

Key component interactions to maintain:
- `shift-form.js` → validates quality control completion
- `roll-zone.js` → updates sticky bar with thickness data
- `roll-conformity.js` → listens to thickness changes for badge updates
- `quality-control.js` → broadcasts completion status
- `sticky-bottom.js` → aggregates data from multiple components

## Common Pitfalls to Avoid

1. **Never modify ID generation logic** - External systems depend on exact formats
2. **Don't skip session saves** - Users expect zero data loss
3. **Maintain keyboard navigation** - Required for production floor usage
4. **Keep components loosely coupled** - Use events, not direct references
5. **Preserve French comments** - Team documentation requirement

## Conception de composants

- Utilise en priorité des trucs "intégré" bootstrap, en consultant la doc quand je te demande quelque chose. pour ne pas réinventer la roue quand c pas necessaire

## Real-time KPI System

### KPI Dashboard Architecture
The KPI dashboard (`kpiDashboard()` in profile.html) calculates metrics in real-time:

1. **Availability (DISPO)**: 
   - Formula: (Available Time / Opening Time) × 100
   - Available Time = Opening Time - Lost Time
   
2. **Performance (PERF)**:
   - Formula: (Net Production / Theoretical Production) × 100
   - Net Production = wound_length_total - length_start + length_end
   - Theoretical Production = Available Time × Belt Speed

3. **Quality (QUALITÉ)**:
   - Formula: (OK Length / Total Length) × 100
   - OK Length adjusted = wound_length_ok - length_start + length_end
   - NOK Length remains unchanged

4. **TRS (Overall Equipment Effectiveness)**:
   - Formula: (Availability × Performance × Quality) / 10000

### Session Counters
Production tracking uses three main counters stored in session:
- `wound_length_ok`: Total OK length from all rolls
- `wound_length_nok`: Total NOK length from all rolls
- `wound_length_total`: Sum of OK and NOK lengths

These counters are updated when rolls are saved and used for real-time KPI calculations.

## Important Production Flows

### Roll Creation Process
1. Operator enters thickness measurements in 12x7 grid
2. System validates against profile specifications (min/max/alerts)
3. Defects are tracked with position and severity
4. Roll conformity is calculated based on:
   - All thickness measurements within tolerance
   - No blocking defects
   - NOK count below threshold
5. Conform rolls go to production, non-conform to cutting

### Shift Validation Requirements
Before saving a shift, the system validates:
1. Quality control form must be completed
2. All required checklist items must be checked
3. Machine state (start/end) must be recorded
4. Operator must be identified with valid vacation type

## Component CSS Customization

Key Bootstrap customizations in use:
- Custom color variables for production states (OK: success, NOK: danger, Alert: warning)
- Larger touch targets for production floor usage (min 44px)
- High contrast ratios for industrial lighting conditions
- Sticky components for constant visibility during scrolling

## Visual Indicators

Production uses color-coded system:
- **Green (success)**: Within specifications
- **Orange (warning)**: Alert threshold reached but still acceptable
- **Red (danger)**: Out of specifications or blocking defect

## Database Initialization

### Fresh Database Setup
The project includes a `load_initial_data` management command that populates a clean database with:
- Quality defect types (Autre, Epaisseurs, Infibré, Insectes, Marque Tapis, Shot, Trou)
- Specification items (thickness, micronaire, surface_mass, resistance, elongation)
- Machine parameters (temperatures, speeds, pressures)
- Product profiles (STANDARD 15MM, PREMIUM 20MM, ECO 12MM)
- WCM lost time reasons (18 categories)
- Checklist items (17 items across 5 categories)
- Sample operators (8 operators)
- Operating modes (Normal, Permissif, Dégradé, Maintenance)
- Mood counters (happy, neutral, unhappy, no_response)

To reset and initialize a fresh database:
```bash
rm db.sqlite3
python manage.py migrate
python manage.py load_initial_data
python manage.py createsuperuser  # Create admin user
```

### Data Backup and Restore

Before any database reset:
```bash
# Full backup
python manage.py dumpdata --indent 2 > backups/backup_$(date +%Y%m%d_%H%M%S).json

# Restore specific apps
python manage.py loaddata backups/backup_XXXXXX.json
```

### Migration Management

All migrations have been recreated to work properly on a fresh database. The previous issues with catalog.0002 and catalog.0003 have been resolved.

## Missing Infrastructure
- Requirements.txt exists with minimal dependencies (Django, DRF, asgiref, sqlparse)
- No configured test framework beyond basic Django tests
- No linting/formatting configuration
- No CI/CD pipeline
```