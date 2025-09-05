import { Component, createSignal, For } from 'solid-js'
import { Column, CellType } from '../models/types'

interface ColumnDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (column: Partial<Column>) => void
  editingColumn?: Column | null
}

const ColumnDialog: Component<ColumnDialogProps> = (props) => {
  const cellTypes: CellType[] = ['string', 'number', 'boolean', 'null', 'object', 'array']
  
  const [name, setName] = createSignal(props.editingColumn?.name || '')
  const [type, setType] = createSignal<CellType>(props.editingColumn?.type || 'string')
  const [defaultValue, setDefaultValue] = createSignal(props.editingColumn?.defaultValue || '')
  const [nullable, setNullable] = createSignal(props.editingColumn?.nullable !== false)

  const handleConfirm = () => {
    if (!name().trim()) {
      alert('Column name is required')
      return
    }

    let parsedDefaultValue = defaultValue()
    
    // Parse default value based on type
    if (defaultValue()) {
      switch (type()) {
        case 'number':
          parsedDefaultValue = Number(defaultValue())
          if (isNaN(parsedDefaultValue)) {
            alert('Default value must be a valid number')
            return
          }
          break
        case 'boolean':
          parsedDefaultValue = defaultValue() === 'true' || defaultValue() === '1'
          break
        case 'null':
          parsedDefaultValue = null
          break
        case 'object':
        case 'array':
          try {
            parsedDefaultValue = JSON.parse(defaultValue())
          } catch (e) {
            alert('Default value must be valid JSON')
            return
          }
          break
      }
    } else {
      parsedDefaultValue = nullable() ? null : getDefaultForType(type())
    }

    props.onConfirm({
      name: name().trim(),
      type: type(),
      defaultValue: parsedDefaultValue,
      nullable: nullable()
    })

    // Reset form
    setName('')
    setType('string')
    setDefaultValue('')
    setNullable(true)
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

  const getDefaultValuePlaceholder = () => {
    switch (type()) {
      case 'number': return 'e.g., 0 or 42'
      case 'boolean': return 'true or false'
      case 'object': return 'e.g., {"key": "value"}'
      case 'array': return 'e.g., [1, 2, 3]'
      case 'null': return 'null'
      default: return 'e.g., Default text'
    }
  }

  if (!props.isOpen) return null

  return (
    <div class="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-96 max-w-full">
        <h2 class="text-xl font-bold mb-4">
          {props.editingColumn ? 'Edit Column' : 'Add Column'}
        </h2>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">Column Name</label>
            <input
              type="text"
              class="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={name()}
              onInput={(e) => setName(e.target.value)}
              placeholder="Enter column name"
              autofocus
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Data Type</label>
            <select
              class="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={type()}
              onChange={(e) => setType(e.target.value as CellType)}
            >
              <For each={cellTypes}>
                {(cellType) => (
                  <option value={cellType}>{cellType}</option>
                )}
              </For>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Default Value</label>
            <input
              type="text"
              class="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={defaultValue()}
              onInput={(e) => setDefaultValue(e.target.value)}
              placeholder={getDefaultValuePlaceholder()}
              disabled={type() === 'null'}
            />
            <p class="text-xs text-gray-500 mt-1">
              Leave empty to use {nullable() ? 'null' : 'type default'}
            </p>
          </div>

          <div>
            <label class="flex items-center">
              <input
                type="checkbox"
                class="mr-2"
                checked={nullable()}
                onChange={(e) => setNullable(e.target.checked)}
              />
              <span class="text-sm">Allow NULL values</span>
            </label>
          </div>
        </div>

        <div class="flex justify-end gap-2 mt-6">
          <button
            class="px-4 py-2 text-gray-600 hover:text-gray-800"
            onClick={props.onClose}
          >
            Cancel
          </button>
          <button
            class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={handleConfirm}
          >
            {props.editingColumn ? 'Update' : 'Add Column'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ColumnDialog