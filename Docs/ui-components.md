# UI Components Documentation

## Profile Component with Tab System

### Overview
The Profile component now features a tabbed interface with two views:
- **Specs&Params**: Machine parameters and quality specifications
- **KPI/TRS**: Key Performance Indicators and OEE metrics

### Features
- Tab navigation in accordion header (right-aligned before chevron)
- Clicking on tabs automatically expands the accordion if collapsed
- Tab state persists across page refreshes via sessionStorage
- Profile and mode selectors only visible in Specs&Params tab

### Technical Implementation
- `profile-tabs.js`: Manages tab state and switching logic
- `profile.js`: Syncs with tab state on initialization
- `profile-tabs.css`: Styling for tab buttons with active state
- Event system: `profile-tab-changed` event for cross-component communication

## Quality Control Component

### Visual Enhancements
- Fixed badge always showing "pending" status on load instead of red
- Added "Contrôles Qualité" label above QC badge in conformity zone
- Removed collapsible functionality - controls always visible
- Numeric-only input validation with automatic formatting
- Timestamp display for dry extract and LOI entries

### Badge Status Logic
- **Pending** (gray): Not all required measurements entered
- **Passed** (green with check): All measurements within tolerance and LOI checked
- **Failed** (red with X): Any measurement out of tolerance or LOI not checked

### Surface Mass Labels
- Changed back to original labels: GG, GC, DC, DD
- 4 decimal precision for average calculations

## Roll Component Layout

### Conformity Zone Styling
- Reduced padding: 0.3rem top/bottom, 1rem left/right
- Three-column layout:
  - Left: Info statistics (thickness count, NOK count, defects)
  - Center: Main conformity badge
  - Right: QC badge with "Contrôles Qualité" label

### Visual Indicators
- Roll conformity badge independent of QC status
- Check icons only shown when actually conforming
- Pending icon (clock) shown appropriately

## Accordion Components

### Styling Updates
- Rounded corners on top only (0.5rem radius)
- Blue chevron icons for text-primary headers
- Removed bottom border from Profile header
- Consistent header styling across all accordions

## Database & Model Updates

### Checklist Template Fix
- Resolved unique constraint issue preventing item modifications
- Migration created to allow multiple templates with same items
- Fixed duplicate entries causing display issues

## KPI Dashboard Component

### Overview
Modern KPI dashboard with 6 cards in a 3x2 grid layout featuring:
- Gradient designs with unique color schemes per KPI
- Animated progress bars
- Trend indicators (up/down/neutral)
- Responsive grid that adapts to screen size

### KPI Cards Implemented
1. **TRS/OEE** - Overall Equipment Effectiveness
2. **Disponibilité** - Machine availability metric
3. **Performance** - Production speed efficiency
4. **Qualité** - Product quality rate
5. **Productivité** - Production output per hour
6. **Taux de rebut** - Scrap/rejection rate

### Technical Details
- `kpi-cards.css`: Styling with gradients and animations
- `kpi-calculations.js`: Business logic for KPI calculations
- Cards use CSS custom properties for theming
- Hover effects with elevation and transitions

### Component Dependencies

#### Roll Component Dependencies
- Listens to: `target-length-changed`, `profile-changed`, `quality-control-updated`
- Emits: `roll-updated`, `thickness-updated`
- DOM Dependencies: `#qc-badge-container`

#### Quality Control Dependencies  
- Looks for: `profileManager` component (with timeout)
- Emits: `quality-control-updated`
- Moves badge to: `#qc-badge-container`

#### Profile Component Dependencies
- Emits: `profile-changed`, `profile-tab-changed`
- Listens to: `target-length-changed`
- Manages: Profile selection and tab state

### Known Issues & Workarounds
1. **Component initialization order**: Quality control uses setTimeout to find profile component
2. **Badge movement**: QC badge is moved to roll component area after render
3. **Event proliferation**: 15+ custom events used for inter-component communication