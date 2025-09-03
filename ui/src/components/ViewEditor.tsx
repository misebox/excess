import { Component, createSignal, For, Show, createEffect } from 'solid-js'
import { View, Table } from '../models/types'
import { queryEngine } from '../services/queryEngine'

interface ViewEditorProps {
  view: View
  tables: Table[]
  onUpdate: (view: View) => void
}

const ViewEditor: Component<ViewEditorProps> = (props) => {
  const [queryResult, setQueryResult] = createSignal<{
    columns: string[]
    rows: any[]
    error?: string
  }>({ columns: [], rows: [] })
  
  const [isExecuting, setIsExecuting] = createSignal(false)

  // Update query engine with available tables
  createEffect(() => {
    queryEngine.setTables(props.tables)
  })

  const executeQuery = () => {
    if (!props.view.query.trim()) {
      setQueryResult({ columns: [], rows: [], error: 'Please enter a query' })
      return
    }

    setIsExecuting(true)
    
    try {
      const result = queryEngine.executeQuery(props.view.query)
      setQueryResult(result)
      
      // Update source tables based on query
      const tables = queryEngine.getAvailableTables()
      const referencedTables = tables.filter(t => 
        props.view.query.toLowerCase().includes(t.toLowerCase())
      )
      
      if (JSON.stringify(referencedTables) !== JSON.stringify(props.view.sourceTables)) {
        props.onUpdate({ ...props.view, sourceTables: referencedTables })
      }
    } catch (error) {
      setQueryResult({ 
        columns: [], 
        rows: [], 
        error: error instanceof Error ? error.message : 'Query execution failed' 
      })
    } finally {
      setIsExecuting(false)
    }
  }

  const formatCellValue = (value: any): string => {
    if (value === null) return 'null'
    if (value === undefined) return ''
    if (typeof value === 'boolean') return value ? 'true' : 'false'
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
  }

  return (
    <div class="p-4 h-full flex flex-col">
      <h2 class="text-xl font-bold mb-4">{props.view.title}</h2>
      
      <div class="mb-4">
        <label class="block text-sm font-medium mb-2">Query</label>
        <textarea
          class="w-full h-32 px-3 py-2 border rounded font-mono text-sm"
          value={props.view.query}
          placeholder="SELECT * FROM table1 WHERE column1 > 100"
          onInput={(e) => props.onUpdate({ ...props.view, query: e.target.value })}
        />
        <div class="mt-2 text-xs text-gray-600">
          <div class="font-semibold mb-1">Supported SQL features:</div>
          <div class="grid grid-cols-2 gap-1">
            <div>• SELECT columns or *</div>
            <div>• WHERE conditions (=, !=, {'<'}, {'>'}, LIKE)</div>
            <div>• JOIN table ON condition</div>
            <div>• ORDER BY column ASC/DESC</div>
            <div>• LIMIT number</div>
            <div>• Aggregate functions (COUNT, SUM, AVG, MAX, MIN)</div>
          </div>
        </div>
      </div>
      
      <div class="mb-4 flex items-center gap-4">
        <button 
          class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300"
          onClick={executeQuery}
          disabled={isExecuting()}
        >
          {isExecuting() ? 'Executing...' : 'Execute Query'}
        </button>
        
        <Show when={props.view.sourceTables.length > 0}>
          <div class="text-sm text-gray-600">
            <span class="font-medium">Source Tables:</span> {props.view.sourceTables.join(', ')}
          </div>
        </Show>
        
        <Show when={props.tables.length > 0}>
          <div class="text-sm text-gray-600">
            <span class="font-medium">Available Tables:</span> {props.tables.map(t => t.title).join(', ')}
          </div>
        </Show>
      </div>
      
      <div class="flex-1 overflow-auto border rounded bg-gray-50">
        <Show when={queryResult().error}>
          <div class="p-4 text-red-600 bg-red-50">
            <span class="font-semibold">Error:</span> {queryResult().error}
          </div>
        </Show>
        
        <Show when={!queryResult().error && (queryResult().columns.length > 0 || queryResult().rows.length > 0)}>
          <div class="overflow-auto">
            <table class="min-w-full bg-white">
              <thead class="bg-gray-100 sticky top-0">
                <tr>
                  <For each={queryResult().columns}>
                    {(column) => (
                      <th class="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b border-r">
                        {column}
                      </th>
                    )}
                  </For>
                </tr>
              </thead>
              <tbody>
                <Show when={queryResult().rows.length === 0}>
                  <tr>
                    <td 
                      colspan={queryResult().columns.length || 1} 
                      class="px-4 py-8 text-center text-gray-500"
                    >
                      No results found
                    </td>
                  </tr>
                </Show>
                <For each={queryResult().rows}>
                  {(row) => (
                    <tr class="border-b hover:bg-gray-50">
                      <For each={queryResult().columns}>
                        {(column) => (
                          <td class="px-4 py-2 text-sm border-r">
                            {formatCellValue(row[column])}
                          </td>
                        )}
                      </For>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        </Show>
        
        <Show when={!queryResult().error && queryResult().columns.length === 0 && queryResult().rows.length === 0}>
          <div class="p-8 text-center text-gray-500">
            Enter a query and click "Execute Query" to see results
          </div>
        </Show>
      </div>
      
      <Show when={queryResult().rows.length > 0}>
        <div class="mt-2 text-sm text-gray-600 text-right">
          {queryResult().rows.length} row{queryResult().rows.length !== 1 ? 's' : ''} returned
        </div>
      </Show>
    </div>
  )
}

export default ViewEditor