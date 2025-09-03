# Excess - Function-Based Table Calculation App

**Design Philosophy**: This is NOT an Excel clone. Instead of cell formulas (=A1+B1), we use reusable Functions that execute in a secure sandbox environment.

## Core Architecture

### Data Models
- **Table**: `{ id, title, columns: [{ name, type }], rows: [{}] }`
- **View**: `{ id, query, source_tables: [] }`
- **Function**: `{ name, params, body }` - Reusable calculations, not cell formulas
- **Layout**: `{ id, elements: [{ type, position, size, data }] }`

### Components

#### Table Editor
- Grid component for data entry and viewing
- Column type inference (string, number, boolean, null)
- Column management (add/delete columns)
- CSV import functionality
- No cell-level formulas - data is calculated via Functions

#### View Engine
- SQL-like queries for table joins/filters
- Real-time result computation
- Reference multiple tables

#### Function System
- **Key Differentiator**: Functions are standalone, reusable calculations
- JavaScript-based evaluation in secure sandbox
- Reference tables, views, and other functions
- Execute on-demand, not per-cell

#### Layout Builder
- Free-form canvas for dashboards
- Drag/drop tables, views, charts
- Charts are Layout-only (not embedded in tables)
- Multiple layout sheets

## Implementation Stack
- Frontend: React + TypeScript
- State: Zustand or Redux
- Grid: AG-Grid or custom canvas
- Parser: SQL.js or custom query parser

## File Structure
```
src/
  models/     # Data types
  stores/     # State management
  components/ # UI components
  engine/     # Calculation engine
  utils/      # Helpers
```

## Implementation Status

### Completed ✓
- Core data models (Project, Table, View, Function, Layout)
- IndexedDB persistence layer
- Table editor with inline cell editing
- Function execution engine with secure sandbox
- CSV import functionality
- Column management (add/delete columns)
- +Column button in table header
- TypeScript type system
- Basic UI components (Sidebar, TabBar, etc.)

### Missing Essential Features

## Priority 1: Core Table Functionality

### 1. Data Export
**Problem**: Can import CSV but no export functionality
**Implementation**:
- CSV export functionality
- JSON export for all project data
- Copy table data to clipboard
- Export function results

### 2. Enhanced Data Import
**Problem**: Limited import options
**Implementation**:
- Excel file import (.xlsx) using SheetJS
- Copy/paste from external spreadsheets
- Drag-and-drop file upload
- Import validation and error handling

### 3. Data Validation & Types
**Problem**: No input validation or automatic type conversion
**Implementation**:
- Cell data validation rules (number ranges, text patterns)
- Automatic type inference on paste/import
- Format options (currency, percentage, dates)
- Data type conversion helpers
- Input error handling and user feedback

## Priority 2: Essential Table Operations

### 4. Sorting & Filtering
**Problem**: No way to sort or filter table data
**Implementation**:
- Column header click to sort (asc/desc)
- Filter dropdowns per column
- Multi-column sorting
- Custom filter conditions (>, <, contains, etc.)
- Filter state persistence

### 5. Row Management
**Problem**: Limited row operations
**Implementation**:
- Insert/delete rows at specific positions
- Drag-to-select multiple rows
- Right-click context menus for rows
- Undo/redo for structure changes

### 6. Find & Replace
**Problem**: No search functionality within tables
**Implementation**:
- Find/replace dialog with regex support
- Highlight matching cells
- Replace in selection or entire table
- Case-sensitive search options

## Priority 3: Advanced Features

### 7. Charts & Visualization
**Problem**: Layout supports charts but no implementation
**Implementation**:
- Chart.js or Recharts integration for Layout component
- Line, bar, pie, scatter chart types
- Chart configuration UI in Layout builder
- Data series selection from tables/views/functions
- Chart updates when referenced data changes
- Charts are Layout-exclusive (not embedded in tables)

### 8. Collaboration Features
**Problem**: Single-user only
**Implementation**:
- Real-time collaboration using WebRTC or WebSocket
- Conflict resolution for concurrent edits
- User presence indicators
- Comment system for cells
- Change history and version tracking

### 9. Advanced SQL View Engine
**Problem**: Views use string queries but no SQL parser
**Implementation**:
- SQL parser for JOIN, WHERE, GROUP BY, ORDER BY
- Query builder UI for non-technical users
- View result caching and invalidation
- Subquery support
- Aggregate functions integration

## Priority 4: User Experience

### 10. Keyboard Navigation
**Problem**: Mouse-only interface
**Implementation**:
- Arrow key navigation between cells
- Tab/Shift+Tab for cell traversal
- Enter to confirm edits and move down
- Escape to cancel edits
- Keyboard shortcuts for common actions

### 11. Performance Optimization
**Problem**: No optimization for large datasets
**Implementation**:
- Virtual scrolling for large tables
- Lazy loading of table rows
- Efficient diff algorithms for updates
- Web Worker for heavy calculations
- IndexedDB query optimization

### 12. UI/UX Improvements
**Problem**: Basic styling and limited interactions
**Implementation**:
- Resizable columns with drag handles
- Row/column highlighting on hover
- Loading states and progress indicators
- Responsive design for mobile devices
- Dark mode theme support

## Technical Debt & Infrastructure

### 13. Error Handling & Testing
**Implementation**:
- Comprehensive error boundaries
- User-friendly error messages
- Unit tests for core functions
- Integration tests for data flow
- E2E tests for critical user paths

### 14. Documentation & Help
**Implementation**:
- In-app help system
- Function reference documentation
- Keyboard shortcut cheatsheet
- Video tutorials for complex features
- Migration guides for updates

## Development Priorities

**Phase 1** (Essential): Items 1-6 (Data Export, Enhanced Import, Validation, Sorting, Row Management, Find/Replace)
**Phase 2** (Polish): Items 7-9 (Charts for Layout, Collaboration, Advanced SQL)  
**Phase 3** (Scale): Items 10-12 (Keyboard nav, Performance, UI/UX)
**Phase 4** (Quality): Items 13-14 (Testing, Documentation)

## Key Design Decisions

1. **Function-Based**: No Excel-style cell formulas (=A1+B1). Use reusable Functions instead.
2. **Secure Sandbox**: Functions execute in isolated environment for security.
3. **Layout Charts**: Charts only exist in Layout component, not embedded in tables.
4. **CSV Support**: Import implemented, export needed.
5. **Column Management**: Add/delete columns supported, +Column button in header.
6. **Table Focus**: Core app is about table data management and Function calculations.