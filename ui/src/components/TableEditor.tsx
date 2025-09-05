import { Component, For, createSignal, Show, onMount, onCleanup, createMemo, createEffect } from 'solid-js'
import { Table, CellType, Column } from '../models/types'
import ColumnDialog from './ColumnDialog'
import SearchDialog, { SearchOptions } from './SearchDialog'
import ConfirmDialog from './common/ConfirmDialog'
import CellEditor from './CellEditor'
import { exportToCSV, exportToTSV, exportToJSON, downloadFile } from '../utils/exportUtils'

// ============================================================================
// INTERFACES
// ============================================================================

interface TableEditorProps {
  table: Table
  onUpdate: (table: Table) => void
}

interface SearchResult {
  row: number
  col: string
  index?: number
}

interface CellPosition {
  row: number
  col: string
}

interface Selection {
  start: CellPosition
  end: CellPosition
}

interface HistoryEntry {
  table: Table
  timestamp: number
}

// ============================================================================
// COMPONENT
// ============================================================================

const TableEditor: Component<TableEditorProps> = (props) => {
  // ============================================================================
  // STATE DECLARATIONS
  // ============================================================================
  
  // Cell editing state
  const [editingCell, setEditingCell] = createSignal<CellPosition | null>(null)
  const [editingColumnName, setEditingColumnName] = createSignal<string | null>(null)
  const [editingColumnValue, setEditingColumnValue] = createSignal<string>('')
  
  // Selection and interaction state
  const [selection, setSelection] = createSignal<Selection | null>(null)
  const [isSelecting, setIsSelecting] = createSignal(false)
  const [selectedRows, setSelectedRows] = createSignal<Set<number>>(new Set())
  const [contextMenu, setContextMenu] = createSignal<{x: number, y: number, row: number} | null>(null)
  
  // Dialog state
  const [showColumnDialog, setShowColumnDialog] = createSignal(false)
  const [showSearchDialog, setShowSearchDialog] = createSignal(false)
  const [showFilters, setShowFilters] = createSignal(false)
  const [columnToDelete, setColumnToDelete] = createSignal<Column | null>(null)
  const [columnContextMenu, setColumnContextMenu] = createSignal<{
    x: number
    y: number
    column: Column
  } | null>(null)
  
  // Clipboard and history state
  const [clipboard, setClipboard] = createSignal<any[][]>([])
  const [history, setHistory] = createSignal<HistoryEntry[]>([])
  const [historyIndex, setHistoryIndex] = createSignal(-1)
  
  // Sorting and filtering state
  const [sortColumn, setSortColumn] = createSignal<string | null>(null)
  const [sortDirection, setSortDirection] = createSignal<'asc' | 'desc'>('asc')
  const [columnFilters, setColumnFilters] = createSignal<{ [key: string]: string }>({})
  
  // Column resizing state
  const [columnWidths, setColumnWidths] = createSignal<{ [key: string]: number }>({})
  const [resizingColumn, setResizingColumn] = createSignal<string | null>(null)
  const [resizeStartX, setResizeStartX] = createSignal(0)
  const [resizeStartWidth, setResizeStartWidth] = createSignal(0)
  
  // Search state
  const [searchHighlight, setSearchHighlight] = createSignal<{row: number, col: string} | null>(null)
  const [lastSearchTerm, setLastSearchTerm] = createSignal('')
  const [lastSearchIndex, setLastSearchIndex] = createSignal(0)
  const [searchResults, setSearchResults] = createSignal<SearchResult[]>([])
  const [currentSearchIndex, setCurrentSearchIndex] = createSignal(-1)

  // Constants
  const MAX_HISTORY = 50
  
  // Row validation state
  const [rowValidationStatus, setRowValidationStatus] = createSignal<Map<number, { valid: boolean, errors: string[] }>>(new Map())
  
  // Validate a single row
  const validateRow = (row: Record<string, any>, rowIndex: number): { valid: boolean, errors: string[] } => {
    const errors: string[] = []
    
    // Check each column's constraints
    props.table.columns.forEach(column => {
      const value = row[column.name]
      
      // Check nullable constraint
      if (column.nullable === false && (value === null || value === undefined || value === '')) {
        errors.push(`${column.name} is required`)
      }
      
      // Check type constraints
      if (value !== null && value !== undefined && value !== '') {
        switch (column.type) {
          case 'number':
            if (typeof value !== 'number' && isNaN(Number(value))) {
              errors.push(`${column.name} must be a number`)
            }
            break
          case 'boolean':
            if (typeof value !== 'boolean') {
              errors.push(`${column.name} must be true or false`)
            }
            break
          case 'date':
          case 'datetime':
            // Basic date validation
            if (typeof value === 'string' && !Date.parse(value)) {
              errors.push(`${column.name} must be a valid date`)
            }
            break
        }
      }
    })
    
    return { valid: errors.length === 0, errors }
  }
  
  // Validate all rows
  const validateAllRows = () => {
    const newValidationStatus = new Map<number, { valid: boolean, errors: string[] }>()
    props.table.rows.forEach((row, index) => {
      newValidationStatus.set(index, validateRow(row, index))
    })
    setRowValidationStatus(newValidationStatus)
  }
  
  // Run validation when table data changes
  createEffect(() => {
    validateAllRows()
  })

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================
  
  // Filtered rows based on column filters
  const filteredRows = createMemo(() => {
    const filters = columnFilters()
    const hasFilters = Object.values(filters).some(f => f.length > 0)
    
    if (!hasFilters) {
      return props.table.rows
    }
    
    return props.table.rows.filter(row => {
      return Object.entries(filters).every(([colName, filterValue]) => {
        if (!filterValue) return true
        const cellValue = String(row[colName] ?? '').toLowerCase()
        return cellValue.includes(filterValue.toLowerCase())
      })
    })
  })

  // Sorted rows based on sort column and direction
  const getSortedRows = createMemo(() => {
    const col = sortColumn()
    if (!col) {
      return filteredRows()
    }
    
    return [...filteredRows()].sort((a, b) => {
      const aVal = a[col]
      const bVal = b[col]
      
      let comparison = 0
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal
      } else {
        comparison = String(aVal).localeCompare(String(bVal))
      }
      
      return sortDirection() === 'asc' ? comparison : -comparison
    })
  })

  // ============================================================================
  // LIFECYCLE
  // ============================================================================
  
  onMount(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('click', handleDocumentClick)
    // Initialize history with current state
    addToHistory(props.table)
  })

  onCleanup(() => {
    document.removeEventListener('keydown', handleKeyDown)
    document.removeEventListener('click', handleDocumentClick)
  })

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================
  
  const handleDocumentClick = (e: MouseEvent) => {
    // Close context menu if clicking outside
    if (contextMenu() && !(e.target as HTMLElement).closest('.context-menu')) {
      setContextMenu(null)
    }
  }

  const handleMouseUp = () => {
    setIsSelecting(false)
  }

  // ============================================================================
  // HISTORY OPERATIONS
  // ============================================================================
  
  const addToHistory = (table: Table) => {
    const currentHistory = history()
    const currentIndex = historyIndex()
    
    // Remove any history after current index (for when we undo then make new changes)
    const newHistory = currentHistory.slice(0, currentIndex + 1)
    
    // Add new entry
    newHistory.push({
      table: JSON.parse(JSON.stringify(table)),
      timestamp: Date.now()
    })
    
    // Limit history size
    if (newHistory.length > MAX_HISTORY) {
      newHistory.shift()
    }
    
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const undo = () => {
    const currentIndex = historyIndex()
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1
      const historyEntry = history()[newIndex]
      if (historyEntry) {
        setHistoryIndex(newIndex)
        props.onUpdate(JSON.parse(JSON.stringify(historyEntry.table)))
      }
    }
  }

  const redo = () => {
    const currentIndex = historyIndex()
    const hist = history()
    if (currentIndex < hist.length - 1) {
      const newIndex = currentIndex + 1
      const historyEntry = hist[newIndex]
      if (historyEntry) {
        setHistoryIndex(newIndex)
        props.onUpdate(JSON.parse(JSON.stringify(historyEntry.table)))
      }
    }
  }

  // ============================================================================
  // KEYBOARD HANDLING
  // ============================================================================
  
  const handleKeyDown = (e: KeyboardEvent) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
    const ctrlKey = isMac ? e.metaKey : e.ctrlKey

    // Don't handle keys when editing a cell (except for navigation keys)
    if (editingCell()) {
      // Let the CellEditor handle Enter, Escape, and Tab
      return
    }

    if (ctrlKey) {
      switch(e.key.toLowerCase()) {
        case 'c':
          e.preventDefault()
          copySelection()
          break
        case 'x':
          e.preventDefault()
          cutSelection()
          break
        case 'v':
          e.preventDefault()
          pasteSelection()
          break
        case 'z':
          e.preventDefault()
          if (e.shiftKey) {
            redo()
          } else {
            undo()
          }
          break
        case 'f':
          e.preventDefault()
          setShowSearchDialog(true)
          break
      }
    } else {
      switch(e.key) {
        case 'ArrowUp':
          e.preventDefault()
          moveSelection(-1, 0, e.shiftKey)
          break
        case 'ArrowDown':
          e.preventDefault()
          moveSelection(1, 0, e.shiftKey)
          break
        case 'ArrowLeft':
          e.preventDefault()
          moveSelection(0, -1, e.shiftKey)
          break
        case 'ArrowRight':
          e.preventDefault()
          moveSelection(0, 1, e.shiftKey)
          break
        case 'Tab':
          e.preventDefault()
          moveSelection(0, e.shiftKey ? -1 : 1)
          break
        case 'Enter':
        case 'F2':
          e.preventDefault()
          const sel = selection()
          if (sel) {
            setEditingCell({ row: sel.start.row, col: sel.start.col })
          }
          break
        case 'Delete':
        case 'Backspace':
          e.preventDefault()
          clearSelection()
          break
        default:
          // No longer start editing on character input
          break
      }
    }
  }

  // ============================================================================
  // SELECTION OPERATIONS
  // ============================================================================
  
  const moveSelection = (rowDelta: number, colDelta: number, extend: boolean = false) => {
    const sel = selection()
    if (!sel) {
      // Start from top-left if no selection
      setSelection({
        start: { row: 0, col: props.table.columns[0]?.name || '' },
        end: { row: 0, col: props.table.columns[0]?.name || '' }
      })
      return
    }

    const cols = props.table.columns.map(c => c.name)
    const currentColIndex = cols.indexOf(sel.end.col)
    
    let newRow = Math.max(0, Math.min(props.table.rows.length - 1, sel.end.row + rowDelta))
    let newColIndex = Math.max(0, Math.min(cols.length - 1, currentColIndex + colDelta))
    let newCol = cols[newColIndex]

    if (extend) {
      setSelection({
        start: sel.start,
        end: { row: newRow, col: newCol }
      })
    } else {
      setSelection({
        start: { row: newRow, col: newCol },
        end: { row: newRow, col: newCol }
      })
    }
  }

  const clearSelection = () => {
    const sel = selection()
    if (!sel) return
    
    const cells = getCellsInSelection(sel)
    const newTable = JSON.parse(JSON.stringify(props.table))
    
    cells.forEach(cell => {
      if (newTable.rows[cell.row]) {
        newTable.rows[cell.row][cell.col] = null
      }
    })
    
    addToHistory(newTable)
    props.onUpdate(newTable)
  }

  const getCellsInSelection = (sel: Selection): CellPosition[] => {
    const cells: CellPosition[] = []
    const startRow = Math.min(sel.start.row, sel.end.row)
    const endRow = Math.max(sel.start.row, sel.end.row)
    
    const colIndices = props.table.columns.map((c, i) => ({ name: c.name, index: i }))
    const startColIndex = colIndices.find(c => c.name === sel.start.col)?.index ?? 0
    const endColIndex = colIndices.find(c => c.name === sel.end.col)?.index ?? 0
    const startCol = Math.min(startColIndex, endColIndex)
    const endCol = Math.max(startColIndex, endColIndex)
    
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        if (props.table.columns[c]) {
          cells.push({ row: r, col: props.table.columns[c].name })
        }
      }
    }
    
    return cells
  }

  const isCellSelected = (rowIndex: number, columnName: string): boolean => {
    const sel = selection()
    if (!sel) return false
    
    const cells = getCellsInSelection(sel)
    return cells.some(c => c.row === rowIndex && c.col === columnName)
  }

  // ============================================================================
  // CLIPBOARD OPERATIONS
  // ============================================================================
  
  const copySelection = () => {
    const sel = selection()
    if (!sel) return
    
    const cells = getCellsInSelection(sel)
    const data: any[][] = []
    
    let currentRow = -1
    let rowData: any[] = []
    
    cells.forEach(cell => {
      if (cell.row !== currentRow) {
        if (rowData.length > 0) {
          data.push(rowData)
        }
        rowData = []
        currentRow = cell.row
      }
      rowData.push(props.table.rows[cell.row]?.[cell.col] ?? null)
    })
    
    if (rowData.length > 0) {
      data.push(rowData)
    }
    
    setClipboard(data)
    
    // Also copy to system clipboard as TSV
    const tsv = data.map(row => row.map(cell => 
      cell === null ? '' : String(cell)
    ).join('\t')).join('\n')
    
    navigator.clipboard.writeText(tsv)
  }

  const cutSelection = () => {
    copySelection()
    
    const sel = selection()
    if (!sel) return
    
    const newTable = JSON.parse(JSON.stringify(props.table))
    const cells = getCellsInSelection(sel)
    
    cells.forEach(cell => {
      if (newTable.rows[cell.row]) {
        newTable.rows[cell.row][cell.col] = null
      }
    })
    
    addToHistory(newTable)
    props.onUpdate(newTable)
  }

  const pasteSelection = async () => {
    const sel = selection()
    if (!sel) return
    
    let data = clipboard()
    
    // Try to get from system clipboard
    try {
      const text = await navigator.clipboard.readText()
      if (text) {
        const rows = text.split('\n').map(row => 
          row.split('\t').map(cell => {
            if (cell === '') return null
            if (!isNaN(Number(cell))) return Number(cell)
            if (cell === 'true') return true
            if (cell === 'false') return false
            return cell
          })
        )
        if (rows.length > 0) {
          data = rows
        }
      }
    } catch (e) {
      // Use internal clipboard
    }
    
    if (data.length === 0) return
    
    const newTable = JSON.parse(JSON.stringify(props.table))
    const startRow = Math.min(sel.start.row, sel.end.row)
    const colIndices = props.table.columns.map((c, i) => ({ name: c.name, index: i }))
    const startColIndex = colIndices.find(c => c.name === sel.start.col)?.index ?? 0
    
    data.forEach((rowData, r) => {
      const targetRow = startRow + r
      if (targetRow >= newTable.rows.length) {
        // Add new row if needed
        const newRow: Record<string, any> = {}
        props.table.columns.forEach(col => {
          newRow[col.id] = null
        })
        newTable.rows.push(newRow)
      }
      
      rowData.forEach((cellData, c) => {
        const targetCol = startColIndex + c
        if (targetCol < props.table.columns.length) {
          const colId = props.table.columns[targetCol].name
          newTable.rows[targetRow][colId] = cellData
        }
      })
    })
    
    addToHistory(newTable)
    props.onUpdate(newTable)
  }

  // ============================================================================
  // CELL OPERATIONS
  // ============================================================================
  
  const updateCell = (rowIndex: number, columnName: string, value: any) => {
    const newRows = [...props.table.rows]
    newRows[rowIndex] = { ...newRows[rowIndex], [columnName]: value }
    const newTable = { ...props.table, rows: newRows }
    addToHistory(newTable)
    props.onUpdate(newTable)
    
    // Revalidate the updated row
    const updatedValidation = new Map(rowValidationStatus())
    updatedValidation.set(rowIndex, validateRow(newRows[rowIndex], rowIndex))
    setRowValidationStatus(updatedValidation)
  }

  const handleCellMouseDown = (e: MouseEvent, rowIndex: number, columnId: string) => {
    if (e.shiftKey && selection()) {
      // Extend selection
      const sel = selection()
      if (sel) {
        setSelection({
          start: sel.start,
          end: { row: rowIndex, col: columnId }
        })
      }
    } else {
      // Start new selection
      setSelection({
        start: { row: rowIndex, col: columnId },
        end: { row: rowIndex, col: columnId }
      })
      setIsSelecting(true)
    }
  }

  const handleCellMouseEnter = (rowIndex: number, columnId: string) => {
    if (isSelecting() && selection()) {
      const sel = selection()
      if (sel) {
        setSelection({
          start: sel.start,
          end: { row: rowIndex, col: columnId }
        })
      }
    }
  }

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================
  
  const parseBooleanValue = (value: any): boolean => {
    if (value === null || value === undefined) return false
    if (typeof value === 'boolean') return value
    if (typeof value === 'number') return value === 1
    if (typeof value === 'string') {
      const lower = value.toLowerCase().trim()
      return lower === 'true' || lower === '1' || lower === 'on' || lower === 'yes'
    }
    return false
  }
  
  // ============================================================================
  // ROW OPERATIONS
  // ============================================================================
  
  const addRow = () => {
    const newRow: Record<string, any> = {}
    props.table.columns.forEach(col => {
      // Set default values based on column configuration
      if (col.defaultValue !== undefined) {
        newRow[col.name] = col.defaultValue
      } else if (col.nullable === false) {
        // For non-nullable columns without default, set type-appropriate empty value
        switch (col.type) {
          case 'string':
            newRow[col.name] = ''
            break
          case 'number':
            newRow[col.name] = 0
            break
          case 'boolean':
            newRow[col.name] = false
            break
          default:
            newRow[col.name] = null
        }
      } else {
        newRow[col.name] = null
      }
    })
    const newTable = { ...props.table, rows: [...props.table.rows, newRow] }
    addToHistory(newTable)
    props.onUpdate(newTable)
    
    // Validate the new row
    const newRowIndex = props.table.rows.length
    const updatedValidation = new Map(rowValidationStatus())
    updatedValidation.set(newRowIndex, validateRow(newRow, newRowIndex))
    setRowValidationStatus(updatedValidation)
  }

  const deleteRow = (rowIndex: number) => {
    const newRows = [...props.table.rows]
    newRows.splice(rowIndex, 1)
    const newTable = { ...props.table, rows: newRows }
    addToHistory(newTable)
    props.onUpdate(newTable)
  }

  const deleteSelectedRows = () => {
    const rowsToDelete = Array.from(selectedRows()).sort((a, b) => b - a) // Sort descending to delete from bottom
    const newRows = [...props.table.rows]
    rowsToDelete.forEach(index => {
      newRows.splice(index, 1)
    })
    const newTable = { ...props.table, rows: newRows }
    addToHistory(newTable)
    props.onUpdate(newTable)
    setSelectedRows(new Set())
    setContextMenu(null)
  }

  // ============================================================================
  // COLUMN OPERATIONS
  // ============================================================================
  
  const handleAddColumn = (columnData: Partial<Column>) => {
    const newColumn: Column = {
      id: `col_${Date.now()}`,
      name: columnData.name || `Column ${props.table.columns.length + 1}`,
      type: columnData.type || 'string',
      defaultValue: columnData.defaultValue,
      nullable: columnData.nullable
    }
    
    // Add default value to existing rows
    const newRows = props.table.rows.map(row => ({ 
      ...row, 
      [newColumn.name]: columnData.defaultValue ?? (columnData.nullable ? null : getDefaultForType(newColumn.type))
    }))
    
    const newTable = {
      ...props.table,
      columns: [...props.table.columns, newColumn],
      rows: newRows
    }
    addToHistory(newTable)
    props.onUpdate(newTable)
    setShowColumnDialog(false)
  }
  
  const handleDeleteColumn = (column: Column) => {
    const newTable = { ...props.table }
    
    // Remove column from columns array
    newTable.columns = newTable.columns.filter(c => c.id !== column.id)
    
    // Remove column data from all rows
    newTable.rows = newTable.rows.map(row => {
      const newRow = { ...row }
      delete newRow[column.name]
      return newRow
    })
    
    // Remove column from primary keys
    if (newTable.primaryKey) {
      newTable.primaryKey = newTable.primaryKey.filter(pk => pk !== column.name)
      if (newTable.primaryKey.length === 0) {
        delete newTable.primaryKey
      }
    }
    
    // Remove column from unique constraints
    if (newTable.uniqueConstraints) {
      newTable.uniqueConstraints = newTable.uniqueConstraints
        .map(uc => ({
          ...uc,
          columns: uc.columns.filter(c => c !== column.name)
        }))
        .filter(uc => uc.columns.length > 0) // Remove empty constraints
      
      if (newTable.uniqueConstraints.length === 0) {
        delete newTable.uniqueConstraints
      }
    }
    
    // Remove column from indexes
    if (newTable.indexes) {
      newTable.indexes = newTable.indexes
        .map(idx => ({
          ...idx,
          columns: idx.columns.filter(c => c !== column.name)
        }))
        .filter(idx => idx.columns.length > 0) // Remove empty indexes
      
      if (newTable.indexes.length === 0) {
        delete newTable.indexes
      }
    }
    
    addToHistory(newTable)
    props.onUpdate(newTable)
    setColumnToDelete(null)
    setColumnContextMenu(null)
  }

  const getDefaultForType = (type: CellType): any => {
    switch (type) {
      case 'string': return ''
      case 'number': return 0
      case 'boolean': return false
      case 'null': return null
      case 'object': return {}
      case 'array': return []
    }
  }

  const deleteColumn = (columnId: string) => {
    if (props.table.columns.length <= 1) {
      alert('Table must have at least one column')
      return
    }
    
    const newColumns = props.table.columns.filter(col => col.id !== columnId)
    const newRows = props.table.rows.map(row => {
      const newRow = { ...row }
      delete newRow[columnId]
      return newRow
    })
    
    const newTable = {
      ...props.table,
      columns: newColumns,
      rows: newRows
    }
    addToHistory(newTable)
    props.onUpdate(newTable)
  }

  const renameColumn = (columnId: string, newName: string) => {
    // Find the old column name
    const oldColumn = props.table.columns.find(col => col.id === columnId)
    if (!oldColumn) return
    
    const oldName = oldColumn.name
    
    // Update column definition
    const newColumns = props.table.columns.map(col =>
      col.id === columnId ? { ...col, name: newName } : col
    )
    
    // Update row data keys if the name changed
    const newRows = props.table.rows.map(row => {
      if (oldName !== newName && oldName in row) {
        const newRow = { ...row }
        newRow[newName] = newRow[oldName]
        delete newRow[oldName]
        return newRow
      }
      return row
    })
    
    const newTable = { ...props.table, columns: newColumns, rows: newRows }
    addToHistory(newTable)
    props.onUpdate(newTable)
  }

  const handleSort = (columnName: string) => {
    if (sortColumn() === columnName) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(columnName)
      setSortDirection('asc')
    }
  }

  const handleColumnDoubleClick = (columnName: string) => {
    // Auto-fit column width based on content
    let maxWidth = 100
    const rows = getSortedRows()
    
    // Check header width
    maxWidth = Math.max(maxWidth, columnName.length * 10 + 40)
    
    // Check content width
    rows.forEach(row => {
      const value = String(row[columnName] || '')
      const width = Math.min(400, value.length * 8 + 20)
      maxWidth = Math.max(maxWidth, width)
    })
    
    setColumnWidths(prev => ({ ...prev, [columnName]: maxWidth }))
  }

  const handleColumnResizeStart = (e: MouseEvent, columnName: string) => {
    e.preventDefault()
    e.stopPropagation()
    setResizingColumn(columnName)
    setResizeStartX(e.clientX)
    const currentWidth = columnWidths()[columnName] || 150
    setResizeStartWidth(currentWidth)
    
    const handleMouseMove = (e: MouseEvent) => {
      if (resizingColumn()) {
        const delta = e.clientX - resizeStartX()
        const newWidth = Math.max(50, resizeStartWidth() + delta)
        const colName = resizingColumn()
        if (colName) {
          setColumnWidths(prev => ({ ...prev, [colName]: newWidth }))
        }
      }
    }
    
    const handleMouseUp = () => {
      setResizingColumn(null)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // ============================================================================
  // EXPORT/IMPORT OPERATIONS
  // ============================================================================
  
  const handleExportCSV = () => {
    const csv = exportToCSV(props.table)
    downloadFile(csv, `${props.table.title}.csv`, 'text/csv')
  }

  const handleExportTSV = () => {
    const tsv = exportToTSV(props.table)
    downloadFile(tsv, `${props.table.title}.tsv`, 'text/tab-separated-values')
  }

  const handleExportJSON = () => {
    const json = exportToJSON(props.table)
    downloadFile(json, `${props.table.title}.json`, 'application/json')
  }

  // ============================================================================
  // SEARCH OPERATIONS
  // ============================================================================
  
  const handleSearch = (searchTerm: string, options: SearchOptions) => {
    setLastSearchTerm(searchTerm)
    
    const rows = props.table.rows
    const cols = props.table.columns
    
    let startRow = 0
    let startCol = 0
    
    // If same search term, continue from last position
    if (searchTerm === lastSearchTerm() && searchHighlight()) {
      const highlight = searchHighlight()
      if (!highlight) return
      const colIndex = cols.findIndex(c => c.name === highlight.col)
      
      if (colIndex < cols.length - 1) {
        startCol = colIndex + 1
        startRow = highlight.row
      } else {
        startCol = 0
        startRow = highlight.row + 1
      }
    }
    
    // Search from current position
    for (let r = startRow; r < rows.length; r++) {
      for (let c = (r === startRow ? startCol : 0); c < cols.length; c++) {
        const value = String(rows[r][cols[c].name] ?? '')
        
        if (matchesSearch(value, searchTerm, options)) {
          setSearchHighlight({ row: r, col: cols[c].name })
          setSelection({
            start: { row: r, col: cols[c].name },
            end: { row: r, col: cols[c].name }
          })
          return
        }
      }
    }
    
    // Wrap around to beginning
    for (let r = 0; r <= startRow; r++) {
      for (let c = 0; c < (r === startRow ? startCol : cols.length); c++) {
        const value = String(rows[r][cols[c].name] ?? '')
        
        if (matchesSearch(value, searchTerm, options)) {
          setSearchHighlight({ row: r, col: cols[c].name })
          setSelection({
            start: { row: r, col: cols[c].name },
            end: { row: r, col: cols[c].name }
          })
          return
        }
      }
    }
    
    // No match found
    alert('No match found')
  }

  const handleReplace = (searchTerm: string, replaceTerm: string, options: SearchOptions) => {
    const sel = selection()
    if (!sel) return
    
    const value = String(props.table.rows[sel.start.row]?.[sel.start.col] ?? '')
    if (matchesSearch(value, searchTerm, options)) {
      updateCell(sel.start.row, sel.start.col, replaceTerm)
    }
    
    // Find next
    handleSearch(searchTerm, options)
  }

  const handleReplaceAll = (searchTerm: string, replaceTerm: string, options: SearchOptions) => {
    const newTable = JSON.parse(JSON.stringify(props.table))
    let count = 0
    
    newTable.rows.forEach((row: any) => {
      newTable.columns.forEach((col: Column) => {
        const value = String(row[col.name] ?? '')
        if (matchesSearch(value, searchTerm, options)) {
          row[col.name] = replaceTerm
          count++
        }
      })
    })
    
    if (count > 0) {
      addToHistory(newTable)
      props.onUpdate(newTable)
      alert(`Replaced ${count} occurrence(s)`)
    } else {
      alert('No matches found')
    }
  }

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================
  
  const matchesSearch = (value: string, searchTerm: string, options: SearchOptions): boolean => {
    if (!searchTerm) return false
    
    let searchValue = value
    let searchPattern = searchTerm
    
    if (!options.caseSensitive) {
      searchValue = searchValue.toLowerCase()
      searchPattern = searchPattern.toLowerCase()
    }
    
    if (options.useRegex) {
      try {
        const regex = new RegExp(searchPattern, options.caseSensitive ? 'g' : 'gi')
        return regex.test(searchValue)
      } catch {
        return false
      }
    }
    
    if (options.wholeWord) {
      const regex = new RegExp(`\\b${escapeRegex(searchPattern)}\\b`, options.caseSensitive ? 'g' : 'gi')
      return regex.test(searchValue)
    }
    
    return searchValue.includes(searchPattern)
  }

  const escapeRegex = (str: string): string => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  // ============================================================================
  // RENDER
  // ============================================================================
  
  return (
    <div class="p-4" onMouseUp={handleMouseUp}>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-bold">{props.table.title}</h2>
        <div class="flex items-center gap-2">
          <button
            class={`px-3 py-1 rounded text-sm ${
              showFilters() ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
            }`}
            onClick={() => setShowFilters(!showFilters())}
            title="Toggle filters"
          >
            Filter {showFilters() ? '▲' : '▼'}
          </button>
          {Object.values(columnFilters()).some(f => f && f.trim()) && (
            <button
              class="px-3 py-1 rounded text-sm bg-orange-500 text-white hover:bg-orange-600"
              onClick={() => setColumnFilters({})}
              title="Clear all filters"
            >
              Clear Filters
            </button>
          )}
          <div class="text-xs text-gray-500">
            History: {historyIndex() + 1}/{history().length}
          </div>
          <button
            class="px-2 py-1 text-sm bg-gray-400 text-white rounded hover:bg-gray-500 disabled:bg-gray-300"
            onClick={undo}
            disabled={historyIndex() <= 0}
          >
            Undo
          </button>
          <button
            class="px-2 py-1 text-sm bg-gray-400 text-white rounded hover:bg-gray-500 disabled:bg-gray-300"
            onClick={redo}
            disabled={historyIndex() >= history().length - 1}
          >
            Redo
          </button>
          <button
            class="px-3 py-1.5 text-sm bg-green-500 text-white rounded hover:bg-green-600"
            onClick={handleExportCSV}
          >
            Export CSV
          </button>
          <button
            class="px-3 py-1.5 text-sm bg-green-500 text-white rounded hover:bg-green-600"
            onClick={handleExportJSON}
          >
            Export JSON
          </button>
        </div>
      </div>
      
      <div class="overflow-auto border rounded max-h-[600px] relative">
        <table class="min-w-full select-none">
          <thead class="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th class="border-r bg-gray-100 text-center text-xs font-medium text-gray-600" style="width: 40px; min-width: 40px; max-width: 40px;">
                #
              </th>
              <For each={props.table.columns}>
                {(column) => {
                  // Find unique constraints and indexes for this column
                  const uniqueConstraints = props.table.uniqueConstraints?.filter(uc => 
                    uc.columns.includes(column.name)
                  ) || []
                  const uniqueNumbers = uniqueConstraints.map((uc, idx) => {
                    const allUnique = props.table.uniqueConstraints || []
                    return allUnique.indexOf(uc) + 1
                  })
                  
                  const indexes = props.table.indexes?.filter(idx => 
                    idx.columns.includes(column.name) && !idx.unique
                  ) || []
                  const indexNumbers = indexes.map((idx, i) => {
                    const allIndexes = props.table.indexes || []
                    return allIndexes.indexOf(idx) + 1
                  })
                  
                  return (
                  <th 
                    class="p-1 text-left text-sm font-medium text-gray-700 border-r group relative"
                    style={{ width: `${columnWidths()[column.name] || 150}px`, position: 'relative' }}
                    onContextMenu={(e) => {
                      e.preventDefault()
                      setColumnContextMenu({
                        x: e.clientX,
                        y: e.clientY,
                        column
                      })
                    }}>
                    <div class="flex flex-col">
                      <div class="flex items-center justify-between">
                        <button
                          onClick={() => handleSort(column.name)}
                          onDblClick={() => handleColumnDoubleClick(column.name)}
                          class="flex items-center gap-1 hover:bg-gray-100 px-1 rounded"
                        >
                          <span class="font-medium">{column.name}</span>
                          {sortColumn() === column.name && (
                            <span class="text-xs">
                              {sortDirection() === 'asc' ? '▲' : '▼'}
                            </span>
                          )}
                        </button>
                        <div class="flex gap-1">
                          {props.table.primaryKey?.includes(column.name) && (
                            <span class="px-1.5 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded font-medium">PK</span>
                          )}
                          {uniqueNumbers.map(num => (
                            <span class="px-1.5 py-0.5 bg-purple-100 text-purple-800 text-xs rounded font-medium">
                              UQ{num}
                            </span>
                          ))}
                          {indexNumbers.map(num => (
                            <span class="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs rounded font-medium">
                              IDX{num}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div class="flex items-center gap-2 mt-0.5">
                        <span class="text-xs text-gray-500">
                          {column.type}
                        </span>
                        {column.nullable === false && (
                          <span class="text-red-500 font-bold" title="NOT NULL">
                            *
                          </span>
                        )}
                        {column.defaultValue && (
                          <span class="text-xs text-gray-400">
                            = {column.defaultValue}
                          </span>
                        )}
                      </div>
                    </div>
                    <div
                      class="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-400"
                      style={{ 
                        'background-color': resizingColumn() === column.name ? 'rgb(96, 165, 250)' : 'transparent'
                      }}
                      onMouseDown={(e) => handleColumnResizeStart(e, column.name)}
                    />
                  </th>
                  )
                }}
              </For>
              <th class="bg-gray-100 text-center text-xs font-medium text-gray-600" style="width: 30px; min-width: 30px; max-width: 30px;" title="Validation Status">
                ✓
              </th>
            </tr>
            {showFilters() && (
              <tr class="bg-gray-50 sticky top-10 z-10">
                <th class="p-1 border-r"></th>
                <For each={props.table.columns}>
                  {(column) => (
                    <th class="p-1 border-r">
                      <input
                        type="text"
                        class="w-full px-2 py-1 text-sm border rounded"
                        placeholder={`Filter ${column.name}...`}
                        value={columnFilters()[column.name] || ''}
                        onInput={(e) => {
                          setColumnFilters(prev => ({
                            ...prev,
                            [column.name]: e.currentTarget.value
                          }))
                        }}
                      />
                    </th>
                  )}
                </For>
                <th class="p-1"></th>
              </tr>
            )}
          </thead>
          <tbody>
            <For each={getSortedRows()}>
              {(row, rowIndex) => {
                const validationStatus = rowValidationStatus().get(rowIndex())
                const isValid = validationStatus?.valid ?? true
                const errors = validationStatus?.errors ?? []
                
                return (
                <tr class={`border-t group ${!isValid ? 'bg-red-50/50' : ''}`}>
                  <td 
                    class={`border-r text-center text-xs cursor-pointer select-none ${
                      selectedRows().has(rowIndex()) ? 'bg-blue-200 text-blue-800' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                    style="width: 40px; min-width: 40px; max-width: 40px; padding: 2px;"
                    onClick={(e) => {
                      e.stopPropagation()
                      const newSelected = new Set(selectedRows())
                      if (e.ctrlKey || e.metaKey) {
                        if (newSelected.has(rowIndex())) {
                          newSelected.delete(rowIndex())
                        } else {
                          newSelected.add(rowIndex())
                        }
                      } else {
                        newSelected.clear()
                        newSelected.add(rowIndex())
                      }
                      setSelectedRows(newSelected)
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault()
                      if (!selectedRows().has(rowIndex())) {
                        const newSelected = new Set<number>()
                        newSelected.add(rowIndex())
                        setSelectedRows(newSelected)
                      }
                      setContextMenu({x: e.clientX, y: e.clientY, row: rowIndex()})
                    }}
                  >
                    {isValid ? rowIndex() + 1 : '－'}
                  </td>
                  <For each={props.table.columns}>
                    {(column) => {
                      const currentRowIndex = rowIndex() // Capture the current row index
                      return (
                      <td
                        style={{ width: `${columnWidths()[column.name] || 150}px` }}
                        class={`p-1 border-r cursor-pointer ${
                          searchResults().some(r => r.row === currentRowIndex && r.col === column.name && r.index === currentSearchIndex())
                            ? 'bg-yellow-200'
                            : searchResults().some(r => r.row === currentRowIndex && r.col === column.name)
                            ? 'bg-yellow-100'
                            : isCellSelected(currentRowIndex, column.name) 
                            ? 'bg-blue-100' 
                            : 'hover:bg-gray-50'
                        }`}
                        onMouseDown={(e) => handleCellMouseDown(e, currentRowIndex, column.name)}
                        onMouseEnter={() => handleCellMouseEnter(currentRowIndex, column.name)}
                        onDblClick={() => setEditingCell({ row: currentRowIndex, col: column.name })}
                      >
                        {editingCell()?.row === currentRowIndex && editingCell()?.col === column.name ? (
                          <CellEditor
                            initialValue={row[column.name]}
                            onSave={(value) => {
                              // First clear the editing state
                              setEditingCell(null)
                              // Then update the cell value
                              setTimeout(() => {
                                updateCell(currentRowIndex, column.name, value)
                              }, 0)
                            }}
                            onCancel={() => setEditingCell(null)}
                          />
                        ) : column.type === 'boolean' ? (
                          <div class="flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={parseBooleanValue(row[column.name])}
                              onChange={(e) => {
                                updateCell(currentRowIndex, column.name, e.currentTarget.checked ? 'true' : 'false')
                              }}
                              onClick={(e) => e.stopPropagation()}
                              class="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                          </div>
                        ) : (
                          <span class="text-sm">
                            {row[column.name] === null ? 
                              <span class="text-gray-400">null</span> : 
                              String(row[column.name])
                            }
                          </span>
                        )}
                      </td>
                      )
                    }}
                  </For>
                  <td class="text-center border-l" style="width: 30px; min-width: 30px; max-width: 30px; padding: 2px;" title={errors.join('\n')}>
                    {isValid ? (
                      <span class="text-green-600">✓</span>
                    ) : (
                      <span class="text-red-600 cursor-help">⚠</span>
                    )}
                  </td>
                </tr>
                )
              }}
            </For>
          </tbody>
        </table>
      </div>
      
      <div class="mt-4 flex items-center justify-between">
        <button
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={addRow}
        >
          + Add Row
        </button>
        <div class="text-sm text-gray-500">
          Keyboard shortcuts: ⌘C (Copy), ⌘X (Cut), ⌘V (Paste), ⌘Z (Undo), ⌘⇧Z (Redo)
        </div>
      </div>
      
      <ColumnDialog
        isOpen={showColumnDialog()}
        onClose={() => setShowColumnDialog(false)}
        onConfirm={handleAddColumn}
      />
      
      <SearchDialog
        isOpen={showSearchDialog()}
        onClose={() => {
          setShowSearchDialog(false)
          setSearchResults([])
          setCurrentSearchIndex(-1)
        }}
        onSearch={handleSearch}
        onReplace={handleReplace}
        onReplaceAll={handleReplaceAll}
      />
      
      {/* Row Context Menu */}
      <Show when={contextMenu()}>
        <div
          class="context-menu fixed bg-white border rounded shadow-lg py-1 z-50"
          style={{
            left: `${contextMenu()?.x}px`,
            top: `${contextMenu()?.y}px`
          }}
        >
          <button
            class="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
            onClick={() => {
              deleteSelectedRows()
            }}
          >
            Delete {selectedRows().size} row{selectedRows().size > 1 ? 's' : ''}
          </button>
        </div>
      </Show>
      
      {/* Column Context Menu */}
      <Show when={columnContextMenu()}>
        <div
          class="fixed bg-white border rounded shadow-lg py-1 z-50"
          style={{
            left: `${columnContextMenu()?.x}px`,
            top: `${columnContextMenu()?.y}px`,
            "z-index": 100001
          }}
        >
          <button
            class="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm text-red-600"
            onClick={() => {
              setColumnToDelete(columnContextMenu()!.column)
              setColumnContextMenu(null)
            }}
          >
            Delete Column
          </button>
        </div>
      </Show>
      
      {/* Overlay to close context menus */}
      <Show when={columnContextMenu()}>
        <div
          class="fixed inset-0"
          style="z-index: 100000;"
          onClick={() => setColumnContextMenu(null)}
        />
      </Show>
      
      {/* Column Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={columnToDelete() !== null}
        title="Delete Column"
        message={`Are you sure you want to delete the column "${columnToDelete()?.name}"? This will remove the column from the table structure and delete all data in this column. This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={() => {
          if (columnToDelete()) {
            handleDeleteColumn(columnToDelete()!)
          }
        }}
        onCancel={() => setColumnToDelete(null)}
      />
    </div>
  )
}

export default TableEditor