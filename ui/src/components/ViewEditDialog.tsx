import { Component, createSignal, createEffect, For, Show } from 'solid-js'
import { View, Table } from '../models/types'
import { CommonDialog, Button } from './common'

interface ViewEditDialogProps {
  view: View | null
  tables: Table[]
  isOpen: boolean
  onClose: () => void
  onSave: (view: View) => void
}

const ViewEditDialog: Component<ViewEditDialogProps> = (props) => {
  const [title, setTitle] = createSignal('')
  const [query, setQuery] = createSignal('')
  const [selectedTables, setSelectedTables] = createSignal<string[]>([])

  createEffect(() => {
    if (props.view) {
      setTitle(props.view.title)
      setQuery(props.view.query)
      setSelectedTables(props.view.sourceTables || [])
    }
  })

  const handleSave = () => {
    if (!props.view || !title().trim()) return

    const updatedView: View = {
      ...props.view,
      title: title(),
      query: query(),
      sourceTables: selectedTables()
    }

    props.onSave(updatedView)
  }

  const handleTableToggle = (tableName: string) => {
    setSelectedTables(prev => {
      if (prev.includes(tableName)) {
        return prev.filter(t => t !== tableName)
      }
      return [...prev, tableName]
    })
  }

  const insertTableName = (tableName: string) => {
    setQuery(prev => prev + (prev ? ' ' : '') + tableName)
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

  const footer = (
    <div class="flex justify-end gap-2">
      <Button
        variant="ghost"
        onClick={props.onClose}
      >
        Cancel
      </Button>
      <Button
        variant="success"
        onClick={handleSave}
        disabled={!title().trim()}
      >
        Save Changes
      </Button>
    </div>
  )

  return (
    <CommonDialog
      isOpen={props.isOpen && !!props.view}
      onClose={props.onClose}
      title="Edit View"
      maxWidth="max-w-3xl"
      footer={footer}
    >
            <div class="mb-4">
              <label class="block text-sm font-medium mb-2">View Name</label>
              <input
                type="text"
                class="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                value={title()}
                onInput={(e) => setTitle(e.target.value)}
                placeholder="Enter view name"
              />
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium mb-2">Source Tables</label>
              <div class="border rounded p-2 max-h-32 overflow-y-auto bg-gray-50">
                <Show when={props.tables.length === 0}>
                  <p class="text-gray-500 text-sm">No tables available</p>
                </Show>
                <For each={props.tables}>
                  {(table) => (
                    <div class="flex items-center justify-between py-1 hover:bg-white px-2 rounded">
                      <label class="flex items-center gap-2 cursor-pointer flex-1">
                        <input
                          type="checkbox"
                          checked={selectedTables().includes(table.title)}
                          onChange={() => handleTableToggle(table.title)}
                          class="cursor-pointer"
                        />
                        <span class="text-sm">{table.title}</span>
                        <span class="text-xs text-gray-500">({table.rows?.length || 0} rows)</span>
                      </label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => insertTableName(table.title)}
                      >
                        Insert
                      </Button>
                    </div>
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={generateSampleQuery}
                >
                  Generate Sample
                </Button>
              </div>
              <textarea
                class="w-full h-48 px-3 py-2 border rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                value={query()}
                onInput={(e) => setQuery(e.target.value)}
                placeholder="SELECT * FROM table_name WHERE column = value"
              />
              <div class="mt-2 text-xs text-gray-600">
                <details class="cursor-pointer">
                  <summary class="font-semibold mb-1 hover:text-gray-800">Supported SQL features</summary>
                  <div class="grid grid-cols-2 gap-1 mt-2 pl-4">
                    <div>• SELECT columns or *</div>
                    <div>• WHERE conditions (=, !=, {'<'}, {'>'}, LIKE)</div>
                    <div>• JOIN table ON condition</div>
                    <div>• ORDER BY column ASC/DESC</div>
                    <div>• LIMIT number</div>
                    <div>• GROUP BY column</div>
                    <div>• Aggregate functions (COUNT, SUM, AVG, MAX, MIN)</div>
                    <div>• Column aliases with AS</div>
                  </div>
                </details>
              </div>
            </div>
    </CommonDialog>
  )
}

export default ViewEditDialog