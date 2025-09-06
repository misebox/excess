import { Component, createSignal, Show, For } from 'solid-js'
import { View, Table } from '../models/types'

interface ViewCreationDialogProps {
  isOpen: boolean
  tables: Table[]
  onClose: () => void
  onSave: (view: Omit<View, 'id'>) => void
}

const ViewCreationDialog: Component<ViewCreationDialogProps> = (props) => {
  const [title, setTitle] = createSignal('New View')
  const [query, setQuery] = createSignal('')
  const [selectedTables, setSelectedTables] = createSignal<string[]>([])

  const handleSave = () => {
    if (!title().trim()) return

    const newView: Omit<View, 'id'> = {
      projectId: '',
      title: title(),
      query: query(),
      sourceTables: selectedTables()
    }

    props.onSave(newView)
    resetForm()
    props.onClose()
  }

  const resetForm = () => {
    setTitle('New View')
    setQuery('')
    setSelectedTables([])
  }

  const handleTableToggle = (tableName: string) => {
    setSelectedTables(prev => {
      if (prev.includes(tableName)) {
        return prev.filter(t => t !== tableName)
      }
      return [...prev, tableName]
    })
  }

  const generateSampleQuery = () => {
    if (selectedTables().length === 0) {
      setQuery('SELECT * FROM table_name WHERE condition')
    } else if (selectedTables().length === 1) {
      setQuery(`SELECT * FROM ${selectedTables()[0]}`)
    } else {
      const [first, second] = selectedTables()
      setQuery(`SELECT * FROM ${first} JOIN ${second} ON ${first}.id = ${second}.${first}_id`)
    }
  }

  return (
    <Show when={props.isOpen}>
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <div class="p-4 border-b">
            <h2 class="text-xl font-bold">Create New View</h2>
          </div>

          <div class="p-4 flex-1 overflow-y-auto">
            <div class="mb-4">
              <label class="block text-sm font-medium mb-2">View Name</label>
              <input
                type="text"
                class="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={title()}
                onInput={(e) => setTitle(e.target.value)}
                placeholder="Enter view name"
              />
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium mb-2">Source Tables</label>
              <div class="border rounded p-2 max-h-32 overflow-y-auto">
                <Show when={props.tables.length === 0}>
                  <p class="text-gray-500 text-sm">No tables available</p>
                </Show>
                <For each={props.tables}>
                  {(table) => (
                    <label class="flex items-center gap-2 py-1 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedTables().includes(table.title)}
                        onChange={() => handleTableToggle(table.title)}
                        class="cursor-pointer"
                      />
                      <span class="text-sm">{table.title}</span>
                      <span class="text-xs text-gray-500">({table.rows?.length || 0} rows)</span>
                    </label>
                  )}
                </For>
              </div>
              <Show when={selectedTables().length > 0}>
                <p class="text-xs text-gray-600 mt-1">
                  Selected: {selectedTables().join(', ')}
                </p>
              </Show>
            </div>

            <div class="mb-4">
              <div class="flex items-center justify-between mb-2">
                <label class="block text-sm font-medium">SQL Query</label>
                <button
                  class="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                  onClick={generateSampleQuery}
                >
                  Generate Sample
                </button>
              </div>
              <textarea
                class="w-full h-32 px-3 py-2 border rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={query()}
                onInput={(e) => setQuery(e.target.value)}
                placeholder="SELECT * FROM table_name WHERE column = value"
              />
              <div class="mt-2 text-xs text-gray-600">
                <div class="font-semibold mb-1">Supported SQL features:</div>
                <div class="grid grid-cols-2 gap-1">
                  <div>• SELECT columns or *</div>
                  <div>• WHERE conditions</div>
                  <div>• JOIN table ON condition</div>
                  <div>• ORDER BY column</div>
                  <div>• LIMIT number</div>
                  <div>• Aggregate functions</div>
                </div>
              </div>
            </div>
          </div>

          <div class="p-4 border-t flex justify-end gap-2">
            <button
              class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              onClick={() => {
                resetForm()
                props.onClose()
              }}
            >
              Cancel
            </button>
            <button
              class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300"
              onClick={handleSave}
              disabled={!title().trim()}
            >
              Create View
            </button>
          </div>
        </div>
      </div>
    </Show>
  )
}

export default ViewCreationDialog