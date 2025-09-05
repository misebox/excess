import { Component, For, Show, createMemo } from 'solid-js'
import { Table, TableViewSettings, FilterCondition } from '@/models/types'

interface TableViewProps {
  table: Table
  settings: TableViewSettings
  onSettingsClick?: () => void
}

const TableView: Component<TableViewProps> = (props) => {
  // Apply filters to rows
  const filteredRows = createMemo(() => {
    let rows = [...props.table.rows]
    
    // Apply filters
    if (props.settings.filters) {
      props.settings.filters.forEach(filter => {
        rows = rows.filter(row => applyFilter(row, filter))
      })
    }
    
    // Apply sorting
    if (props.settings.sortBy && props.settings.sortBy.length > 0) {
      rows.sort((a, b) => {
        for (const sort of props.settings.sortBy!) {
          const aVal = a[sort.column]
          const bVal = b[sort.column]
          
          let comparison = 0
          if (aVal === null || aVal === undefined) comparison = 1
          else if (bVal === null || bVal === undefined) comparison = -1
          else if (aVal < bVal) comparison = -1
          else if (aVal > bVal) comparison = 1
          
          if (comparison !== 0) {
            return sort.direction === 'asc' ? comparison : -comparison
          }
        }
        return 0
      })
    }
    
    // Apply limit
    if (props.settings.limit) {
      rows = rows.slice(0, props.settings.limit)
    }
    
    return rows
  })
  
  // Get visible columns
  const visibleColumns = createMemo(() => {
    if (!props.settings.selectedColumns || props.settings.selectedColumns.length === 0) {
      return props.table.columns
    }
    return props.table.columns.filter(col => 
      props.settings.selectedColumns!.includes(col.name)
    )
  })
  
  const applyFilter = (row: Record<string, any>, filter: FilterCondition): boolean => {
    const value = row[filter.column]
    const filterValue = filter.value
    
    switch (filter.operator) {
      case 'equals':
        return value == filterValue
      case 'not_equals':
        return value != filterValue
      case 'contains':
        return String(value).toLowerCase().includes(String(filterValue).toLowerCase())
      case 'starts_with':
        return String(value).toLowerCase().startsWith(String(filterValue).toLowerCase())
      case 'ends_with':
        return String(value).toLowerCase().endsWith(String(filterValue).toLowerCase())
      case 'greater':
        return value > filterValue
      case 'less':
        return value < filterValue
      case 'greater_equal':
        return value >= filterValue
      case 'less_equal':
        return value <= filterValue
      case 'is_null':
        return value === null || value === undefined
      case 'is_not_null':
        return value !== null && value !== undefined
      default:
        return true
    }
  }
  
  return (
    <div class="h-full flex flex-col bg-white">
      <div class="flex items-center justify-between px-2 py-1 bg-gray-50 border-b">
        <div class="flex items-center gap-2">
          <span class="text-xs font-medium text-gray-600">
            Table: {props.table.title}
          </span>
          <Show when={props.settings.filters && props.settings.filters.length > 0}>
            <span class="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
              {props.settings.filters!.length} filter{props.settings.filters!.length > 1 ? 's' : ''}
            </span>
          </Show>
          <Show when={props.settings.sortBy && props.settings.sortBy.length > 0}>
            <span class="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded">
              Sorted
            </span>
          </Show>
        </div>
        <Show when={props.onSettingsClick}>
          <button
            onClick={props.onSettingsClick}
            class="p-1 hover:bg-gray-200 rounded"
            title="Settings"
          >
            ⚙️
          </button>
        </Show>
      </div>
      
      <div class="flex-1 overflow-auto">
        <table class="w-full text-xs">
          <thead class="bg-gray-100 sticky top-0">
            <tr>
              <For each={visibleColumns()}>
                {(column) => (
                  <th class="px-2 py-1 text-left font-medium text-gray-700 border-r">
                    {column.name}
                  </th>
                )}
              </For>
            </tr>
          </thead>
          <tbody>
            <Show when={filteredRows().length === 0}>
              <tr>
                <td 
                  colspan={visibleColumns().length}
                  class="text-center py-4 text-gray-500"
                >
                  No data to display
                </td>
              </tr>
            </Show>
            <For each={filteredRows()}>
              {(row) => (
                <tr class="border-t hover:bg-gray-50">
                  <For each={visibleColumns()}>
                    {(column) => (
                      <td class="px-2 py-1 border-r">
                        {row[column.name] === null ? (
                          <span class="text-gray-400 italic">null</span>
                        ) : column.type === 'boolean' ? (
                          <input
                            type="checkbox"
                            checked={row[column.name] === true || row[column.name] === 'true'}
                            disabled
                            class="pointer-events-none"
                          />
                        ) : column.type === 'datetime' || column.type === 'date' ? (
                          formatDateTime(row[column.name], column.type)
                        ) : (
                          String(row[column.name])
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
      
      <div class="px-2 py-1 bg-gray-50 border-t text-xs text-gray-600">
        Showing {filteredRows().length} of {props.table.rows.length} rows
      </div>
    </div>
  )
}

const formatDateTime = (value: any, type: 'date' | 'datetime'): string => {
  if (!value) return ''
  try {
    const date = new Date(value)
    if (isNaN(date.getTime())) return String(value)
    
    if (type === 'date') {
      return date.toLocaleDateString()
    } else {
      return date.toLocaleString()
    }
  } catch {
    return String(value)
  }
}

export default TableView