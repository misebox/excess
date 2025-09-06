import { Component, For, Show, createSignal } from 'solid-js'
import { Table, View, AppFunction, Layout } from '../models/types'
import TableEditDialog from './TableEditDialog'
import ConfirmDialog from './common/ConfirmDialog'
import Button from './common/Button'

interface SidebarProps {
  tables: Table[]
  views: View[]
  functions: AppFunction[]
  layouts: Layout[]
  activeId: string | null
  activeType: string | null
  onSelect: (id: string, type: 'table' | 'view' | 'function' | 'layout') => void
  onRename: (id: string, type: 'table' | 'view' | 'function' | 'layout', newName: string) => void
  onUpdateTable?: (table: Table) => void
  onEditView?: (view: View) => void
  onAddNew?: (type: 'table' | 'view' | 'function' | 'layout') => void
  onDelete?: (id: string, type: 'table' | 'view' | 'function' | 'layout') => void
}

// Configuration for different item types
const ITEM_CONFIGS = {
  table: { icon: '⊞', activeColor: 'blue', emptyMessage: 'No tables yet' },
  view: { icon: '👁', activeColor: 'green', emptyMessage: 'No views yet' },
  function: { icon: 'ƒ', activeColor: 'purple', emptyMessage: 'No functions yet' },
  layout: { icon: '▦', activeColor: 'orange', emptyMessage: 'No layouts yet' }
} as const

const Sidebar: Component<SidebarProps> = (props) => {
  const [editingTable, setEditingTable] = createSignal<Table | null>(null)
  const [contextMenu, setContextMenu] = createSignal<{
    show: boolean
    x: number
    y: number
    item: any
    type: 'table' | 'view' | 'function' | 'layout'
  } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = createSignal<{
    item: any
    type: 'table' | 'view' | 'function' | 'layout'
  } | null>(null)

  // Helper function to render draggable items
  const renderItem = (
    item: any,
    type: 'table' | 'view' | 'function' | 'layout',
    config: typeof ITEM_CONFIGS[keyof typeof ITEM_CONFIGS]
  ) => {
    const isActive = props.activeId === item.id && props.activeType === type
    const activeClasses = {
      table: 'bg-blue-100 text-blue-700',
      view: 'bg-green-100 text-green-700',
      function: 'bg-purple-100 text-purple-700',
      layout: 'bg-orange-100 text-orange-700'
    }
    
    return (
      <div
        class={`group flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer mb-1 ${
          isActive ? activeClasses[type] : 'hover:bg-gray-200'
        }`}
        onClick={() => props.onSelect(item.id, type)}
        onContextMenu={(e) => {
          e.preventDefault()
          setContextMenu({
            show: true,
            x: e.clientX,
            y: e.clientY,
            item,
            type
          })
        }}
        draggable={true}
        onDragStart={(e) => {
          const dragData = {
            type,
            id: item.id,
            ...(type === 'function' ? { name: item.name } : { title: item.title })
          }
          e.dataTransfer?.setData('application/json', JSON.stringify(dragData))
          if (e.dataTransfer) e.dataTransfer.effectAllowed = 'copy'
        }}
      >
        <span class="text-sm">{config.icon}</span>
        <span class="text-sm flex-1 truncate pr-2" title={item.title || item.name}>
          {item.title || item.name}
        </span>
        {type === 'table' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e: MouseEvent) => {
              e.stopPropagation()
              setEditingTable(item as Table)
            }}
            class="flex-shrink-0"
          >
            Edit
          </Button>
        )}
        {type === 'view' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e: MouseEvent) => {
              e.stopPropagation()
              props.onEditView?.(item as View)
            }}
            class="flex-shrink-0"
          >
            Edit
          </Button>
        )}
      </div>
    )
  }

  // Helper function to render sections
  const renderSection = (
    title: string,
    items: any[],
    type: 'table' | 'view' | 'function' | 'layout'
  ) => {
    const config = ITEM_CONFIGS[type]
    
    return (
      <div class="mb-6">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-xs font-semibold text-gray-500 uppercase">{title}</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => props.onAddNew?.(type)}
            class="px-1.5 py-0.5"
          >
            +
          </Button>
        </div>
        <Show when={items.length === 0}>
          <div class="text-sm text-gray-400 italic">{config.emptyMessage}</div>
        </Show>
        <For each={items}>
          {(item) => renderItem(item, type, config)}
        </For>
      </div>
    )
  }

  return (
    <div class="h-full">
      <div class="p-4">
        {renderSection('Tables', props.tables, 'table')}
        {renderSection('Views', props.views, 'view')}
        {renderSection('Functions', props.functions, 'function')}
        {renderSection('Layouts', props.layouts, 'layout')}
      </div>
      
      <TableEditDialog
        table={editingTable()}
        isOpen={editingTable() !== null}
        onClose={() => setEditingTable(null)}
        onSave={(updatedTable) => {
          props.onUpdateTable?.(updatedTable)
          setEditingTable(null)
        }}
      />
      
      {/* Context Menu */}
      <Show when={contextMenu()}>
        {(menu) => (
          <div
            class="fixed bg-white rounded shadow-lg border py-1 min-w-[120px]"
            style={{
              left: `${menu().x}px`,
              top: `${menu().y}px`,
              "z-index": 100001
            }}
            onClick={() => setContextMenu(null)}
          >
            <button
              class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-red-600"
              onClick={(e) => {
                e.stopPropagation()
                setDeleteConfirm({
                  item: menu().item,
                  type: menu().type
                })
                setContextMenu(null)
              }}
            >
              Delete
            </button>
          </div>
        )}
      </Show>
      
      {/* Overlay to close context menu */}
      <Show when={contextMenu()}>
        <div
          class="fixed inset-0"
          style="z-index: 100000;"
          onClick={() => setContextMenu(null)}
        />
      </Show>
      
      {/* Delete Confirmation Dialog */}
      <Show when={deleteConfirm()}>
        {(confirm) => (
          <ConfirmDialog
            isOpen={true}
            title={`Delete ${confirm().type}`}
            message={`Are you sure you want to delete "${confirm().item.title || confirm().item.name}"? This action cannot be undone.`}
            confirmText="Delete"
            cancelText="Cancel"
            variant="danger"
            onConfirm={() => {
              props.onDelete?.(confirm().item.id, confirm().type)
              setDeleteConfirm(null)
            }}
            onCancel={() => setDeleteConfirm(null)}
          />
        )}
      </Show>
    </div>
  )
}

export default Sidebar