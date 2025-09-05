import { Component, createSignal, For, Show, createEffect } from 'solid-js'
import { Table, Column, Index, CellType } from '../models/types'
import TextField from './common/TextField'
import TextArea from './common/TextArea'
import Select from './common/Select'
import Checkbox from './common/Checkbox'
import Button from './common/Button'
import TemplateSelectDialog from './TemplateSelectDialog'
import { TableTemplate } from '../data/tableTemplates'

interface TableCreateDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (table: Omit<Table, 'id'>) => void
}

const TableCreateDialog: Component<TableCreateDialogProps> = (props) => {
  const [tableName, setTableName] = createSignal('new_table')
  const [tableComment, setTableComment] = createSignal('')
  const [columns, setColumns] = createSignal<Column[]>([
    {
      id: 'col_id',
      name: 'id',
      type: 'number',
      nullable: false
    }
  ])
  const [primaryKeys, setPrimaryKeys] = createSignal<string[]>(['id'])
  const [uniqueConstraints, setUniqueConstraints] = createSignal<Index[]>([])
  const [indexes, setIndexes] = createSignal<Index[]>([])
  const [newIndexName, setNewIndexName] = createSignal('')
  const [newIndexColumns, setNewIndexColumns] = createSignal<string[]>([])
  const [newIndexUnique, setNewIndexUnique] = createSignal(false)
  const [showAddIndex, setShowAddIndex] = createSignal(false)
  const [showTemplateDialog, setShowTemplateDialog] = createSignal(false)

  // Reset form when dialog opens
  createEffect(() => {
    if (props.isOpen) {
      setTableName('new_table')
      setTableComment('')
      setColumns([
        {
          id: 'col_id',
          name: 'id',
          type: 'number',
          nullable: false
        }
      ])
      setPrimaryKeys(['id'])
      setUniqueConstraints([])
      setIndexes([])
      setNewIndexName('')
      setNewIndexColumns([])
      setNewIndexUnique(false)
      setShowAddIndex(false)
    }
  })

  const cellTypes: CellType[] = ['string', 'number', 'boolean', 'date', 'datetime', 'json', 'null']

  const handleColumnUpdate = (columnId: string, field: keyof Column, value: any) => {
    // If we're updating the name field, we also need to update references
    if (field === 'name') {
      const oldColumn = columns().find(col => col.id === columnId)
      if (oldColumn) {
        // Update primary keys
        if (primaryKeys().includes(oldColumn.name)) {
          setPrimaryKeys(prev => prev.map(pk => pk === oldColumn.name ? value : pk))
        }
        
        // Update unique constraints
        setUniqueConstraints(prev => prev.map(constraint => {
          if (constraint.columns.includes(oldColumn.name)) {
            return {
              ...constraint,
              columns: constraint.columns.map(col => col === oldColumn.name ? value : col)
            }
          }
          return constraint
        }))
        
        // Update regular indexes
        setIndexes(prev => prev.map(index => {
          if (index.columns.includes(oldColumn.name)) {
            return {
              ...index,
              columns: index.columns.map(col => col === oldColumn.name ? value : col)
            }
          }
          return index
        }))
      }
    }
    
    setColumns(prev => prev.map(col => 
      col.id === columnId ? { ...col, [field]: value } : col
    ))
  }

  const handlePrimaryKeyToggle = (columnName: string) => {
    setPrimaryKeys(prev => {
      if (prev.includes(columnName)) {
        return prev.filter(pk => pk !== columnName)
      } else {
        return [...prev, columnName]
      }
    })
  }

  const isColumnUnique = (columnName: string): boolean => {
    // Check if there's a single-column unique constraint for this column
    return uniqueConstraints().some(constraint => 
      constraint.columns.length === 1 && constraint.columns[0] === columnName
    )
  }

  const handleUniqueToggle = (columnName: string) => {
    if (isColumnUnique(columnName)) {
      // Remove the unique constraint
      setUniqueConstraints(prev => 
        prev.filter(constraint => 
          !(constraint.columns.length === 1 && constraint.columns[0] === columnName)
        )
      )
    } else {
      // Add a unique constraint
      const newConstraint: Index = {
        name: `idx_${columnName}_unique`,
        columns: [columnName],
        unique: true
      }
      setUniqueConstraints(prev => [...prev, newConstraint])
    }
  }

  const addIndex = () => {
    if (!newIndexName() || newIndexColumns().length === 0) return
    
    const newIndex: Index = {
      name: newIndexName(),
      columns: [...newIndexColumns()],
      unique: newIndexUnique()
    }
    
    if (newIndexUnique()) {
      setUniqueConstraints(prev => [...prev, newIndex])
    } else {
      setIndexes(prev => [...prev, newIndex])
    }
    
    setNewIndexName('')
    setNewIndexColumns([])
    setNewIndexUnique(false)
    setShowAddIndex(false)
  }

  const removeIndex = (indexName: string, isUnique: boolean) => {
    if (isUnique) {
      setUniqueConstraints(prev => prev.filter(idx => idx.name !== indexName))
    } else {
      setIndexes(prev => prev.filter(idx => idx.name !== indexName))
    }
  }

  const addNewColumn = () => {
    const newColumn: Column = {
      id: `col_${Date.now()}`,
      name: `column_${columns().length + 1}`,
      type: 'string',
      nullable: true
    }
    setColumns(prev => [...prev, newColumn])
  }

  const deleteColumn = (columnId: string) => {
    if (columns().length <= 1) {
      alert('Table must have at least one column')
      return
    }
    setColumns(prev => prev.filter(col => col.id !== columnId))
    // Remove from primary keys if it was selected
    const columnToDelete = columns().find(col => col.id === columnId)
    if (columnToDelete) {
      setPrimaryKeys(prev => prev.filter(pk => pk !== columnToDelete.name))
    }
  }

  const applyTemplate = (template: TableTemplate) => {
    // Apply template structure
    setColumns([...template.columns])
    setPrimaryKeys(template.primaryKey || [])
    setUniqueConstraints(template.uniqueConstraints || [])
    setIndexes(template.indexes || [])
  }

  const handleSave = () => {
    const newTable: Omit<Table, 'id'> = {
      title: tableName(),
      comment: tableComment(),
      columns: columns(),
      rows: [],
      primaryKey: primaryKeys().length > 0 ? primaryKeys() : undefined,
      uniqueConstraints: uniqueConstraints().length > 0 ? uniqueConstraints() : undefined,
      indexes: indexes().length > 0 ? indexes() : undefined
    }
    
    props.onSave(newTable)
    props.onClose()
  }

  return (
    <Show when={props.isOpen}>
      <div class="fixed inset-0 bg-black/30 flex items-center justify-center" style="z-index: 99999;">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div class="px-6 py-4 border-b">
          <h2 class="text-xl font-bold">Create New Table</h2>
        </div>
        
        <div class="flex-1 overflow-auto p-6">
          {/* Table Name and Comment */}
          <div class="mb-6 space-y-4">
            <div>
              <label class="block text-sm font-medium mb-1">Table Name</label>
              <TextField
                value={tableName()}
                onChange={setTableName}
                placeholder="Table name"
                class="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-1">Table Comment</label>
              <TextArea
                value={tableComment()}
                onChange={setTableComment}
                placeholder="Description of this table..."
                rows={2}
              />
            </div>
          </div>

          {/* Template Selection */}
          <div class="mb-4">
            <Button
              variant="secondary"
              onClick={() => setShowTemplateDialog(true)}
            >
              📋 Use Template
            </Button>
          </div>

          {/* Columns */}
          <div class="mb-6">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-lg font-medium">Columns</h3>
              <Button
                variant="primary"
                size="sm"
                onClick={addNewColumn}
              >
                + Add Column
              </Button>
            </div>
            <div class="border rounded overflow-hidden">
              <table class="w-full">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-700">PK</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-700">Unique</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-700">Name</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-700">Type</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-700">Default</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-700">Nullable</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-700">Comment</th>
                    <th class="px-3 py-2 text-center text-xs font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <For each={columns()}>
                    {(column) => (
                      <tr class="border-t hover:bg-gray-50">
                        <td class="px-3 py-2">
                          <Checkbox
                            checked={primaryKeys().includes(column.name)}
                            onChange={() => handlePrimaryKeyToggle(column.name)}
                          />
                        </td>
                        <td class="px-3 py-2">
                          <Checkbox
                            checked={isColumnUnique(column.name)}
                            onChange={() => handleUniqueToggle(column.name)}
                          />
                        </td>
                        <td class="px-3 py-2">
                          <TextField
                            value={column.name}
                            onChange={(value) => handleColumnUpdate(column.id, 'name', value)}
                            placeholder="Column name"
                          />
                        </td>
                        <td class="px-3 py-2">
                          <Select
                            value={column.type}
                            onChange={(value) => handleColumnUpdate(column.id, 'type', value)}
                            options={cellTypes}
                          />
                        </td>
                        <td class="px-3 py-2">
                          <TextField
                            value={column.defaultValue ?? ''}
                            onChange={(value) => handleColumnUpdate(column.id, 'defaultValue', value || undefined)}
                            placeholder="null"
                          />
                        </td>
                        <td class="px-3 py-2 text-center">
                          <Checkbox
                            checked={column.nullable !== false}
                            onChange={(checked) => handleColumnUpdate(column.id, 'nullable', checked)}
                          />
                        </td>
                        <td class="px-3 py-2">
                          <TextField
                            value={column.comment || ''}
                            onChange={(value) => handleColumnUpdate(column.id, 'comment', value)}
                            placeholder="Column description..."
                          />
                        </td>
                        <td class="px-3 py-2 text-center">
                          <Button
                            variant="danger"
                            size="xs"
                            onClick={() => deleteColumn(column.id)}
                            title="Delete column"
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>
            </div>
          </div>

          {/* Primary Key */}
          <div class="mb-6">
            <h3 class="text-lg font-medium mb-3">Primary Key</h3>
            <div class="bg-gray-50 rounded p-3">
              {primaryKeys().length > 0 ? (
                <div class="flex flex-wrap gap-2">
                  <For each={primaryKeys()}>
                    {(pk) => (
                      <span class="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                        {pk}
                      </span>
                    )}
                  </For>
                </div>
              ) : (
                <p class="text-gray-500 text-sm">No primary key defined</p>
              )}
            </div>
          </div>

          {/* Indexes and Unique Constraints */}
          <div class="mb-6">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-lg font-medium">Indexes & Unique Constraints</h3>
              <button
                class="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={() => setShowAddIndex(!showAddIndex())}
              >
                + Add Index
              </button>
            </div>
            
            <Show when={showAddIndex()}>
              <div class="bg-gray-50 rounded p-4 mb-3">
                <div class="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label class="block text-sm font-medium mb-1">Index Name</label>
                    <input
                      class="w-full px-2 py-1 border rounded"
                      value={newIndexName()}
                      onInput={(e) => setNewIndexName(e.currentTarget.value)}
                      placeholder="idx_column_name"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium mb-1">Type</label>
                    <label class="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={newIndexUnique()}
                        onChange={(e) => setNewIndexUnique(e.currentTarget.checked)}
                      />
                      <span class="text-sm">Unique Constraint</span>
                    </label>
                  </div>
                </div>
                <div class="mb-3">
                  <label class="block text-sm font-medium mb-1">Columns</label>
                  <div class="flex flex-wrap gap-2">
                    <For each={columns()}>
                      {(column) => (
                        <label class="flex items-center gap-1">
                          <input
                            type="checkbox"
                            checked={newIndexColumns().includes(column.name)}
                            onChange={(e) => {
                              if (e.currentTarget.checked) {
                                setNewIndexColumns(prev => [...prev, column.name])
                              } else {
                                setNewIndexColumns(prev => prev.filter(c => c !== column.name))
                              }
                            }}
                          />
                          <span class="text-sm">{column.name}</span>
                        </label>
                      )}
                    </For>
                  </div>
                </div>
                <div class="flex gap-2">
                  <button
                    class="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                    onClick={addIndex}
                  >
                    Add
                  </button>
                  <button
                    class="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
                    onClick={() => {
                      setShowAddIndex(false)
                      setNewIndexName('')
                      setNewIndexColumns([])
                      setNewIndexUnique(false)
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </Show>

            <div class="space-y-2">
              <For each={uniqueConstraints()}>
                {(idx) => (
                  <div class="flex items-center justify-between bg-yellow-50 rounded p-2">
                    <div>
                      <span class="text-sm font-medium">{idx.name}</span>
                      <span class="ml-2 text-xs text-yellow-700">UNIQUE</span>
                      <span class="ml-2 text-xs text-gray-600">({idx.columns.join(', ')})</span>
                    </div>
                    <button
                      class="text-red-500 hover:text-red-700 text-sm"
                      onClick={() => removeIndex(idx.name, true)}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </For>
              
              <For each={indexes()}>
                {(idx) => (
                  <div class="flex items-center justify-between bg-gray-50 rounded p-2">
                    <div>
                      <span class="text-sm font-medium">{idx.name}</span>
                      <span class="ml-2 text-xs text-gray-700">INDEX</span>
                      <span class="ml-2 text-xs text-gray-600">({idx.columns.join(', ')})</span>
                    </div>
                    <button
                      class="text-red-500 hover:text-red-700 text-sm"
                      onClick={() => removeIndex(idx.name, false)}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </For>
            </div>
          </div>
        </div>
        
        <div class="px-6 py-4 border-t flex justify-end gap-3">
          <Button
            variant="ghost"
            onClick={props.onClose}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
          >
            Create Table
          </Button>
        </div>
      </div>
    </div>
    
    <TemplateSelectDialog
      isOpen={showTemplateDialog()}
      onClose={() => setShowTemplateDialog(false)}
      onSelect={applyTemplate}
    />
    </Show>
  )
}

export default TableCreateDialog