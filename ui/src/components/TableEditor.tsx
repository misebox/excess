import { Component, For, createSignal, Show, onMount, onCleanup } from 'solid-js'
import { Table, CellType } from '../models/types'

interface TableEditorProps {
  table: Table
  onUpdate: (table: Table) => void
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

const TableEditor: Component<TableEditorProps> = (props) => {
  const [editingCell, setEditingCell] = createSignal<CellPosition | null>(null)
  const [newColumnType, setNewColumnType] = createSignal<CellType>('string')
  const [editingColumnName, setEditingColumnName] = createSignal<string | null>(null)
  const [editingColumnValue, setEditingColumnValue] = createSignal<string>('')
  const [selection, setSelection] = createSignal<Selection | null>(null)
  const [isSelecting, setIsSelecting] = createSignal(false)
  const [clipboard, setClipboard] = createSignal<any[][]>([])
  const [history, setHistory] = createSignal<HistoryEntry[]>([])
  const [historyIndex, setHistoryIndex] = createSignal(-1)

  const cellTypes: CellType[] = ['string', 'number', 'boolean', 'null', 'object', 'array']
  const MAX_HISTORY = 50

  onMount(() => {
    document.addEventListener('keydown', handleKeyDown)
    // Initialize history with current state
    addToHistory(props.table)
  })

  onCleanup(() => {
    document.removeEventListener('keydown', handleKeyDown)
  })

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

  const handleKeyDown = (e: KeyboardEvent) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
    const ctrlKey = isMac ? e.metaKey : e.ctrlKey

    if (ctrlKey) {
      switch(e.key.toLowerCase()) {
        case 'c':
          if (!editingCell()) {
            e.preventDefault()
            copySelection()
          }
          break
        case 'x':
          if (!editingCell()) {
            e.preventDefault()
            cutSelection()
          }
          break
        case 'v':
          if (!editingCell()) {
            e.preventDefault()
            pasteSelection()
          }
          break
        case 'z':
          if (!editingCell()) {
            e.preventDefault()
            if (e.shiftKey) {
              redo()
            } else {
              undo()
            }
          }
          break
      }
    }
  }

  const getCellsInSelection = (sel: Selection): CellPosition[] => {
    const cells: CellPosition[] = []
    const startRow = Math.min(sel.start.row, sel.end.row)
    const endRow = Math.max(sel.start.row, sel.end.row)
    
    const colIndices = props.table.columns.map((c, i) => ({ id: c.id, index: i }))
    const startColIndex = colIndices.find(c => c.id === sel.start.col)?.index ?? 0
    const endColIndex = colIndices.find(c => c.id === sel.end.col)?.index ?? 0
    const startCol = Math.min(startColIndex, endColIndex)
    const endCol = Math.max(startColIndex, endColIndex)
    
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        if (props.table.columns[c]) {
          cells.push({ row: r, col: props.table.columns[c].id })
        }
      }
    }
    
    return cells
  }

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
    const colIndices = props.table.columns.map((c, i) => ({ id: c.id, index: i }))
    const startColIndex = colIndices.find(c => c.id === sel.start.col)?.index ?? 0
    
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
          const colId = props.table.columns[targetCol].id
          newTable.rows[targetRow][colId] = cellData
        }
      })
    })
    
    addToHistory(newTable)
    props.onUpdate(newTable)
  }

  const updateCell = (rowIndex: number, columnId: string, value: any) => {
    const newRows = [...props.table.rows]
    newRows[rowIndex] = { ...newRows[rowIndex], [columnId]: value }
    const newTable = { ...props.table, rows: newRows }
    addToHistory(newTable)
    props.onUpdate(newTable)
  }

  const addRow = () => {
    const newRow: Record<string, any> = {}
    props.table.columns.forEach(col => {
      newRow[col.id] = null
    })
    const newTable = { ...props.table, rows: [...props.table.rows, newRow] }
    addToHistory(newTable)
    props.onUpdate(newTable)
  }

  const addColumn = () => {
    const newColumn = {
      id: `col_${Date.now()}`,
      name: `Column ${props.table.columns.length + 1}`,
      type: newColumnType()
    }
    const newRows = props.table.rows.map(row => ({ ...row, [newColumn.id]: null }))
    const newTable = {
      ...props.table,
      columns: [...props.table.columns, newColumn],
      rows: newRows
    }
    addToHistory(newTable)
    props.onUpdate(newTable)
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
    const newColumns = props.table.columns.map(col =>
      col.id === columnId ? { ...col, name: newName } : col
    )
    const newTable = { ...props.table, columns: newColumns }
    addToHistory(newTable)
    props.onUpdate(newTable)
  }

  const deleteRow = (rowIndex: number) => {
    const newRows = [...props.table.rows]
    newRows.splice(rowIndex, 1)
    const newTable = { ...props.table, rows: newRows }
    addToHistory(newTable)
    props.onUpdate(newTable)
  }

  const handleImportCSV = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv'
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      
      const text = await file.text()
      const lines = text.trim().split('\n')
      
      if (lines.length === 0) return
      
      // Parse headers
      const headers = lines[0].split(',').map(h => h.trim())
      const columns = headers.map((name, i) => ({
        id: `col_${Date.now()}_${i}`,
        name,
        type: 'string' as CellType
      }))
      
      // Parse rows
      const rows = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim())
        const row: Record<string, any> = {}
        columns.forEach((col, i) => {
          const value = values[i] || null
          // Try to infer type
          if (value === null || value === '') {
            row[col.id] = null
          } else if (!isNaN(Number(value))) {
            row[col.id] = Number(value)
          } else if (value === 'true' || value === 'false') {
            row[col.id] = value === 'true'
          } else {
            row[col.id] = value
          }
        })
        return row
      })
      
      const newTable = {
        ...props.table,
        columns,
        rows
      }
      addToHistory(newTable)
      props.onUpdate(newTable)
    }
    
    input.click()
  }

  const handleCellMouseDown = (e: MouseEvent, rowIndex: number, columnId: string) => {
    if (e.shiftKey && selection()) {
      // Extend selection
      setSelection({
        start: selection()!.start,
        end: { row: rowIndex, col: columnId }
      })
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
      setSelection({
        start: selection()!.start,
        end: { row: rowIndex, col: columnId }
      })
    }
  }

  const handleMouseUp = () => {
    setIsSelecting(false)
  }

  const isCellSelected = (rowIndex: number, columnId: string): boolean => {
    const sel = selection()
    if (!sel) return false
    
    const cells = getCellsInSelection(sel)
    return cells.some(c => c.row === rowIndex && c.col === columnId)
  }

  return (
    <div class="p-4" onMouseUp={handleMouseUp}>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-bold">{props.table.title}</h2>
        <div class="flex items-center gap-2">
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
            class="px-3 py-1.5 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
            onClick={handleImportCSV}
          >
            Import CSV
          </button>
          <select
            class="px-2 py-1 text-sm border rounded"
            value={newColumnType()}
            onChange={(e) => setNewColumnType(e.currentTarget.value as CellType)}
          >
            <For each={cellTypes}>
              {(type) => <option value={type}>{type}</option>}
            </For>
          </select>
          <button
            class="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={addColumn}
          >
            + Column
          </button>
        </div>
      </div>
      
      <div class="overflow-auto border rounded">
        <table class="min-w-full select-none">
          <thead class="bg-gray-50">
            <tr>
              <th class="w-12 px-2 py-2 border-r bg-gray-100 text-center text-xs font-medium text-gray-600">
                #
              </th>
              <th class="w-10 px-2 py-2 border-r"></th>
              <For each={props.table.columns}>
                {(column) => (
                  <th class="px-4 py-2 text-left text-sm font-medium text-gray-700 border-r group relative">
                    <div class="flex items-center justify-between">
                      <Show when={editingColumnName() === column.id} fallback={
                        <div class="flex items-center gap-2 flex-1">
                          <span onClick={() => {
                            setEditingColumnName(column.id)
                            setEditingColumnValue(column.name)
                          }} class="cursor-text hover:bg-gray-100 px-1 rounded">
                            {column.name}
                          </span>
                          <span class="text-xs text-gray-500">({column.type})</span>
                        </div>
                      }>
                        <input
                          class="px-1 py-0.5 border rounded text-sm flex-1"
                          value={editingColumnValue()}
                          onInput={(e) => setEditingColumnValue(e.currentTarget.value)}
                          onBlur={() => {
                            if (editingColumnValue().trim()) {
                              renameColumn(column.id, editingColumnValue().trim())
                            }
                            setEditingColumnName(null)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              if (editingColumnValue().trim()) {
                                renameColumn(column.id, editingColumnValue().trim())
                              }
                              setEditingColumnName(null)
                            }
                            if (e.key === 'Escape') {
                              setEditingColumnName(null)
                            }
                          }}
                          autofocus
                        />
                      </Show>
                      <button
                        class="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 ml-2"
                        onClick={() => deleteColumn(column.id)}
                        title="Delete column"
                      >
                        ×
                      </button>
                    </div>
                  </th>
                )}
              </For>
            </tr>
          </thead>
          <tbody>
            <For each={props.table.rows}>
              {(row, rowIndex) => (
                <tr class="border-t group">
                  <td class="px-2 py-1 border-r bg-gray-50 text-center text-xs text-gray-600">
                    {rowIndex() + 1}
                  </td>
                  <td class="px-2 py-1 border-r text-center">
                    <button
                      class="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 text-sm"
                      onClick={() => deleteRow(rowIndex())}
                      title="Delete row"
                    >
                      ×
                    </button>
                  </td>
                  <For each={props.table.columns}>
                    {(column) => (
                      <td
                        class={`px-4 py-2 border-r cursor-pointer ${
                          isCellSelected(rowIndex(), column.id) 
                            ? 'bg-blue-100' 
                            : 'hover:bg-gray-50'
                        }`}
                        onMouseDown={(e) => handleCellMouseDown(e, rowIndex(), column.id)}
                        onMouseEnter={() => handleCellMouseEnter(rowIndex(), column.id)}
                        onDblClick={() => setEditingCell({ row: rowIndex(), col: column.id })}
                      >
                        {editingCell()?.row === rowIndex() && editingCell()?.col === column.id ? (
                          <input
                            class="w-full px-1 py-0.5 border rounded"
                            value={row[column.id] ?? ''}
                            onBlur={(e) => {
                              updateCell(rowIndex(), column.id, e.target.value)
                              setEditingCell(null)
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                updateCell(rowIndex(), column.id, e.currentTarget.value)
                                setEditingCell(null)
                              }
                              if (e.key === 'Escape') {
                                setEditingCell(null)
                              }
                            }}
                            autofocus
                          />
                        ) : (
                          <span class="text-sm">
                            {row[column.id] === null ? 
                              <span class="text-gray-400">null</span> : 
                              String(row[column.id])
                            }
                          </span>
                        )}
                      </td>
                    )}
                  </For>
                </tr>
              )}
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
    </div>
  )
}

export default TableEditor