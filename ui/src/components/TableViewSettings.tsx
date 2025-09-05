import { Component, createSignal, For, Show, createEffect } from 'solid-js'
import { Table, TableViewSettings, FilterCondition, SortCondition } from '@/models/types'

interface TableViewSettingsDialogProps {
  isOpen: boolean
  table: Table | null
  settings: TableViewSettings
  onClose: () => void
  onSave: (settings: TableViewSettings) => void
}

const TableViewSettingsDialog: Component<TableViewSettingsDialogProps> = (props) => {
  const [selectedColumns, setSelectedColumns] = createSignal<string[]>(props.settings.selectedColumns || [])
  const [filters, setFilters] = createSignal<FilterCondition[]>(props.settings.filters || [])
  const [sortBy, setSortBy] = createSignal<SortCondition[]>(props.settings.sortBy || [])
  const [limit, setLimit] = createSignal<number | undefined>(props.settings.limit)
  const [selectAll, setSelectAll] = createSignal(!props.settings.selectedColumns || props.settings.selectedColumns.length === 0)

  // Update state when props change
  createEffect(() => {
    if (props.isOpen && props.table) {
      setSelectedColumns(props.settings.selectedColumns || props.table.columns.map(c => c.name))
      setFilters(props.settings.filters || [])
      setSortBy(props.settings.sortBy || [])
      setLimit(props.settings.limit)
      setSelectAll(!props.settings.selectedColumns || props.settings.selectedColumns.length === 0)
    }
  })

  const operators = [
    { value: 'equals', label: '=' },
    { value: 'not_equals', label: '≠' },
    { value: 'contains', label: 'contains' },
    { value: 'starts_with', label: 'starts with' },
    { value: 'ends_with', label: 'ends with' },
    { value: 'greater', label: '>' },
    { value: 'less', label: '<' },
    { value: 'greater_equal', label: '≥' },
    { value: 'less_equal', label: '≤' },
    { value: 'is_null', label: 'is null' },
    { value: 'is_not_null', label: 'is not null' }
  ]

  const handleColumnToggle = (columnName: string) => {
    setSelectedColumns(prev => {
      if (prev.includes(columnName)) {
        return prev.filter(c => c !== columnName)
      } else {
        return [...prev, columnName]
      }
    })
    setSelectAll(false)
  }

  const handleSelectAllToggle = () => {
    if (selectAll()) {
      setSelectedColumns([])
      setSelectAll(false)
    } else {
      setSelectedColumns(props.table?.columns.map(c => c.name) || [])
      setSelectAll(true)
    }
  }

  const addFilter = () => {
    const firstColumn = props.table?.columns[0]?.name || ''
    setFilters(prev => [...prev, {
      column: firstColumn,
      operator: 'equals',
      value: ''
    }])
  }

  const updateFilter = (index: number, field: keyof FilterCondition, value: any) => {
    setFilters(prev => prev.map((f, i) => 
      i === index ? { ...f, [field]: value } : f
    ))
  }

  const removeFilter = (index: number) => {
    setFilters(prev => prev.filter((_, i) => i !== index))
  }

  const addSort = () => {
    const firstColumn = props.table?.columns[0]?.name || ''
    setSortBy(prev => [...prev, {
      column: firstColumn,
      direction: 'asc'
    }])
  }

  const updateSort = (index: number, field: keyof SortCondition, value: any) => {
    setSortBy(prev => prev.map((s, i) => 
      i === index ? { ...s, [field]: value } : s
    ))
  }

  const removeSort = (index: number) => {
    setSortBy(prev => prev.filter((_, i) => i !== index))
  }

  const handleSave = () => {
    const settings: TableViewSettings = {
      tableId: props.settings.tableId,
      selectedColumns: selectAll() ? undefined : selectedColumns(),
      filters: filters().length > 0 ? filters() : undefined,
      sortBy: sortBy().length > 0 ? sortBy() : undefined,
      limit: limit()
    }
    props.onSave(settings)
    props.onClose()
  }

  if (!props.isOpen || !props.table) return null

  return (
    <div class="fixed inset-0 bg-black/30 flex items-center justify-center" style="z-index: 99999;">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <div class="px-6 py-4 border-b">
          <h2 class="text-xl font-bold">Table View Settings</h2>
        </div>
        
        <div class="flex-1 overflow-auto p-6 space-y-6">
          {/* Column Selection */}
          <div>
            <h3 class="text-lg font-semibold mb-3">Visible Columns</h3>
            <div class="space-y-2">
              <label class="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                <input
                  type="checkbox"
                  checked={selectAll()}
                  onChange={handleSelectAllToggle}
                  class="rounded"
                />
                <span class="font-medium">Select All</span>
              </label>
              <div class="ml-4 space-y-1">
                <For each={props.table.columns}>
                  {(column) => (
                    <label class="flex items-center gap-2 p-1 hover:bg-gray-50 rounded">
                      <input
                        type="checkbox"
                        checked={selectedColumns().includes(column.name)}
                        onChange={() => handleColumnToggle(column.name)}
                        disabled={selectAll()}
                        class="rounded"
                      />
                      <span>{column.name}</span>
                      <span class="text-xs text-gray-500">({column.type})</span>
                    </label>
                  )}
                </For>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div>
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-lg font-semibold">Filters</h3>
              <button
                class="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={addFilter}
              >
                + Add Filter
              </button>
            </div>
            <div class="space-y-2">
              <For each={filters()}>
                {(filter, index) => (
                  <div class="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <select
                      class="px-2 py-1 border rounded"
                      value={filter.column}
                      onChange={(e) => updateFilter(index(), 'column', e.currentTarget.value)}
                    >
                      <For each={props.table?.columns}>
                        {(column) => (
                          <option value={column.name}>{column.name}</option>
                        )}
                      </For>
                    </select>
                    
                    <select
                      class="px-2 py-1 border rounded"
                      value={filter.operator}
                      onChange={(e) => updateFilter(index(), 'operator', e.currentTarget.value)}
                    >
                      <For each={operators}>
                        {(op) => (
                          <option value={op.value}>{op.label}</option>
                        )}
                      </For>
                    </select>
                    
                    <Show when={filter.operator !== 'is_null' && filter.operator !== 'is_not_null'}>
                      <input
                        type="text"
                        class="flex-1 px-2 py-1 border rounded"
                        value={filter.value || ''}
                        onInput={(e) => updateFilter(index(), 'value', e.currentTarget.value)}
                        placeholder="Value"
                      />
                    </Show>
                    
                    <button
                      class="px-2 py-1 text-red-500 hover:text-red-700"
                      onClick={() => removeFilter(index())}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </For>
            </div>
          </div>

          {/* Sorting */}
          <div>
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-lg font-semibold">Sort By</h3>
              <button
                class="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={addSort}
              >
                + Add Sort
              </button>
            </div>
            <div class="space-y-2">
              <For each={sortBy()}>
                {(sort, index) => (
                  <div class="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <select
                      class="px-2 py-1 border rounded"
                      value={sort.column}
                      onChange={(e) => updateSort(index(), 'column', e.currentTarget.value)}
                    >
                      <For each={props.table?.columns}>
                        {(column) => (
                          <option value={column.name}>{column.name}</option>
                        )}
                      </For>
                    </select>
                    
                    <select
                      class="px-2 py-1 border rounded"
                      value={sort.direction}
                      onChange={(e) => updateSort(index(), 'direction', e.currentTarget.value as 'asc' | 'desc')}
                    >
                      <option value="asc">Ascending ↑</option>
                      <option value="desc">Descending ↓</option>
                    </select>
                    
                    <button
                      class="px-2 py-1 text-red-500 hover:text-red-700"
                      onClick={() => removeSort(index())}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </For>
            </div>
          </div>

          {/* Limit */}
          <div>
            <h3 class="text-lg font-semibold mb-3">Row Limit</h3>
            <input
              type="number"
              class="px-3 py-2 border rounded w-32"
              value={limit() || ''}
              onInput={(e) => {
                const val = e.currentTarget.value
                setLimit(val ? parseInt(val) : undefined)
              }}
              placeholder="No limit"
              min="1"
            />
          </div>
        </div>
        
        <div class="px-6 py-4 border-t flex justify-end gap-3">
          <button
            class="px-4 py-2 text-gray-600 hover:text-gray-800"
            onClick={props.onClose}
          >
            Cancel
          </button>
          <button
            class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={handleSave}
          >
            Apply Settings
          </button>
        </div>
      </div>
    </div>
  )
}

export default TableViewSettingsDialog