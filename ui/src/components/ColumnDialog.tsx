import { Component, createSignal, For } from 'solid-js'
import { Column, CellType } from '../models/types'
import { CommonDialog, Button } from './common'

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

  const footer = (
    <div class="flex justify-end gap-2">
      <Button
        variant="ghost"
        onClick={props.onClose}
      >
        Cancel
      </Button>
      <Button
        variant="primary"
        onClick={handleConfirm}
      >
        {props.editingColumn ? 'Update' : 'Add Column'}
      </Button>
    </div>
  )

  return (
    <CommonDialog
      isOpen={props.isOpen}
      onClose={props.onClose}
      title={props.editingColumn ? 'Edit Column' : 'Add Column'}
      maxWidth="max-w-md"
      footer={footer}
    >
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
    </CommonDialog>
  )
}

export default ColumnDialog