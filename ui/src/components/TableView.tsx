import { Component, For, Show, createMemo, createSignal, createEffect } from 'solid-js'
import { Table, TableViewSettings, FilterCondition } from '@/models/types'

interface TableViewProps {
  table: Table
  settings: TableViewSettings
  onSettingsClick?: () => void
}

const TableView: Component<TableViewProps> = (props) => {
  const [currentPage, setCurrentPage] = createSignal(1)
  const itemsPerPage = props.settings.pageSize || 5 // Default to 5 rows per page
  
  // Helper function to parse boolean values flexibly
  const parseBooleanValue = (val: any): boolean | null => {
    if (typeof val === 'boolean') return val
    if (val === null || val === undefined) return null
    
    const strVal = String(val).toLowerCase().trim()
    
    // True values
    if (['true', 't', 'yes', 'y', 'on', '1'].includes(strVal)) {
      return true
    }
    
    // False values
    if (['false', 'f', 'no', 'n', 'off', '0'].includes(strVal)) {
      return false
    }
    
    return null
  }
  
  const applyFilter = (row: Record<string, any>, filter: FilterCondition): boolean => {
    const value = row[filter.column]
    let filterValue = filter.value
    
    console.log(`Checking filter: ${filter.column} ${filter.operator} "${filter.value}" against value: "${value}"`)
    
    // Get column type to determine if we should parse as boolean
    const column = props.table.columns.find(c => c.name === filter.column)
    const isBoolean = column?.type === 'boolean'
    
    // Parse boolean values for boolean columns
    if (isBoolean && filterValue !== null && filterValue !== undefined) {
      const parsedFilter = parseBooleanValue(filterValue)
      const parsedValue = parseBooleanValue(value)
      
      console.log(`Boolean column: parsed filter="${parsedFilter}", parsed value="${parsedValue}"`)
      
      switch (filter.operator) {
        case 'equals':
          const result = parsedValue === parsedFilter
          console.log(`Boolean equals result: ${result}`)
          return result
        case 'not_equals':
          return parsedValue !== parsedFilter
        default:
          // For other operators, use original comparison
          break
      }
    }
    
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

  // Apply filters to rows (without pagination)
  const processedRows = createMemo(() => {
    let rows = [...props.table.rows]
    
    // Apply filters
    if (props.settings.filters && props.settings.filters.length > 0) {
      console.log('Applying filters:', props.settings.filters)
      props.settings.filters.forEach(filter => {
        const beforeCount = rows.length
        rows = rows.filter(row => applyFilter(row, filter))
        console.log(`Filter ${filter.column} ${filter.operator} ${filter.value}: ${beforeCount} -> ${rows.length} rows`)
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
  
  // Calculate pagination
  const totalPages = createMemo(() => Math.ceil(processedRows().length / itemsPerPage))
  
  // Get paginated rows
  const filteredRows = createMemo(() => {
    const start = (currentPage() - 1) * itemsPerPage
    const end = start + itemsPerPage
    return processedRows().slice(start, end)
  })
  
  // Reset to page 1 when filters change
  createEffect(() => {
    processedRows() // Track changes
    setCurrentPage(1)
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
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              console.log('TableView settings button clicked')
              console.log('onSettingsClick function:', props.onSettingsClick)
              if (props.onSettingsClick) {
                props.onSettingsClick()
              }
            }}
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
      
      <div class="px-2 py-1 bg-gray-50 border-t flex items-center justify-between">
        <span class="text-xs text-gray-600">
          {processedRows().length > 0 ? (
            <>
              {((currentPage() - 1) * itemsPerPage) + 1}-{Math.min(currentPage() * itemsPerPage, processedRows().length)} / {processedRows().length}
            </>
          ) : (
            '0 rows'
          )}
        </span>
        
        <Show when={totalPages() > 1}>
          <div class="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage() === 1}
              class="px-1.5 py-0.5 text-xs bg-white border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              title="First page"
            >
              ««
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage() === 1}
              class="px-1.5 py-0.5 text-xs bg-white border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              title="Previous page"
            >
              ‹
            </button>
            <span class="px-2 text-xs text-gray-700 font-medium">
              {currentPage()} / {totalPages()}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages(), prev + 1))}
              disabled={currentPage() === totalPages()}
              class="px-1.5 py-0.5 text-xs bg-white border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              title="Next page"
            >
              ›
            </button>
            <button
              onClick={() => setCurrentPage(totalPages())}
              disabled={currentPage() === totalPages()}
              class="px-1.5 py-0.5 text-xs bg-white border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              title="Last page"
            >
              »»
            </button>
          </div>
        </Show>
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