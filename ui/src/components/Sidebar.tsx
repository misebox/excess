import { Component, For, Show, createSignal } from 'solid-js'
import { Table, View, Function, Layout } from '../models/types'

interface SidebarProps {
  tables: Table[]
  views: View[]
  functions: Function[]
  layouts: Layout[]
  activeId: string | null
  activeType: string | null
  onSelect: (id: string, type: 'table' | 'view' | 'function' | 'layout') => void
  onRename: (id: string, type: 'table' | 'view' | 'function' | 'layout', newName: string) => void
}

const Sidebar: Component<SidebarProps> = (props) => {
  const [editingId, setEditingId] = createSignal<string | null>(null)
  const [editValue, setEditValue] = createSignal('')
  
  const icons = {
    table: '⊞',
    view: '👁',
    function: 'ƒ',
    layout: '▦'
  }

  const startEdit = (e: MouseEvent, id: string, currentName: string) => {
    e.stopPropagation()
    setEditingId(id)
    setEditValue(currentName)
  }

  const finishEdit = (id: string, type: 'table' | 'view' | 'function' | 'layout') => {
    if (editValue().trim()) {
      props.onRename(id, type, editValue().trim())
    }
    setEditingId(null)
  }

  return (
    <div class="w-64 bg-gray-50 border-r h-full overflow-y-auto">
      <div class="p-4">
        <div class="mb-6">
          <h3 class="text-xs font-semibold text-gray-500 uppercase mb-2">Tables</h3>
          <Show when={props.tables.length === 0}>
            <div class="text-sm text-gray-400 italic">No tables yet</div>
          </Show>
          <For each={props.tables}>
            {(table) => (
              <div
                class={`group flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer mb-1 ${
                  props.activeId === table.id && props.activeType === 'table'
                    ? 'bg-blue-100 text-blue-700'
                    : 'hover:bg-gray-200'
                }`}
                onClick={() => props.onSelect(table.id, 'table')}
                draggable={true}
                onDragStart={(e) => {
                  e.dataTransfer?.setData('application/json', JSON.stringify({
                    type: 'table',
                    id: table.id,
                    title: table.title
                  }))
                  e.dataTransfer!.effectAllowed = 'copy'
                }}
              >
                <span class="text-sm">{icons.table}</span>
                <Show when={editingId() === table.id} fallback={
                  <>
                    <span class="text-sm flex-1">{table.title}</span>
                    <button
                      class="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-gray-700"
                      onClick={(e) => startEdit(e, table.id, table.title)}
                      title="Rename"
                    >
                      ✎
                    </button>
                  </>
                }>
                  <input
                    class="text-sm flex-1 px-1 border rounded"
                    value={editValue()}
                    onInput={(e) => setEditValue(e.currentTarget.value)}
                    onBlur={() => finishEdit(table.id, 'table')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') finishEdit(table.id, 'table')
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                    onClick={(e) => e.stopPropagation()}
                    autofocus
                  />
                </Show>
              </div>
            )}
          </For>
        </div>

        <div class="mb-6">
          <h3 class="text-xs font-semibold text-gray-500 uppercase mb-2">Views</h3>
          <Show when={props.views.length === 0}>
            <div class="text-sm text-gray-400 italic">No views yet</div>
          </Show>
          <For each={props.views}>
            {(view) => (
              <div
                class={`group flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer mb-1 ${
                  props.activeId === view.id && props.activeType === 'view'
                    ? 'bg-green-100 text-green-700'
                    : 'hover:bg-gray-200'
                }`}
                onClick={() => props.onSelect(view.id, 'view')}
                draggable={true}
                onDragStart={(e) => {
                  e.dataTransfer?.setData('application/json', JSON.stringify({
                    type: 'view',
                    id: view.id,
                    title: view.title
                  }))
                  e.dataTransfer!.effectAllowed = 'copy'
                }}
              >
                <span class="text-sm">{icons.view}</span>
                <Show when={editingId() === view.id} fallback={
                  <>
                    <span class="text-sm flex-1">{view.title}</span>
                    <button
                      class="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-gray-700"
                      onClick={(e) => startEdit(e, view.id, view.title)}
                      title="Rename"
                    >
                      ✎
                    </button>
                  </>
                }>
                  <input
                    class="text-sm flex-1 px-1 border rounded"
                    value={editValue()}
                    onInput={(e) => setEditValue(e.currentTarget.value)}
                    onBlur={() => finishEdit(view.id, 'view')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') finishEdit(view.id, 'view')
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                    onClick={(e) => e.stopPropagation()}
                    autofocus
                  />
                </Show>
              </div>
            )}
          </For>
        </div>

        <div class="mb-6">
          <h3 class="text-xs font-semibold text-gray-500 uppercase mb-2">Functions</h3>
          <Show when={props.functions.length === 0}>
            <div class="text-sm text-gray-400 italic">No functions yet</div>
          </Show>
          <For each={props.functions}>
            {(func) => (
              <div
                class={`group flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer mb-1 ${
                  props.activeId === func.id && props.activeType === 'function'
                    ? 'bg-purple-100 text-purple-700'
                    : 'hover:bg-gray-200'
                }`}
                onClick={() => props.onSelect(func.id, 'function')}
                draggable={true}
                onDragStart={(e) => {
                  e.dataTransfer?.setData('application/json', JSON.stringify({
                    type: 'function',
                    id: func.id,
                    name: func.name
                  }))
                  e.dataTransfer!.effectAllowed = 'copy'
                }}
              >
                <span class="text-sm">{icons.function}</span>
                <Show when={editingId() === func.id} fallback={
                  <>
                    <span class="text-sm flex-1">{func.name}</span>
                    <button
                      class="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-gray-700"
                      onClick={(e) => startEdit(e, func.id, func.name)}
                      title="Rename"
                    >
                      ✎
                    </button>
                  </>
                }>
                  <input
                    class="text-sm flex-1 px-1 border rounded"
                    value={editValue()}
                    onInput={(e) => setEditValue(e.currentTarget.value)}
                    onBlur={() => finishEdit(func.id, 'function')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') finishEdit(func.id, 'function')
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                    onClick={(e) => e.stopPropagation()}
                    autofocus
                  />
                </Show>
              </div>
            )}
          </For>
        </div>

        <div class="mb-6">
          <h3 class="text-xs font-semibold text-gray-500 uppercase mb-2">Layouts</h3>
          <Show when={props.layouts.length === 0}>
            <div class="text-sm text-gray-400 italic">No layouts yet</div>
          </Show>
          <For each={props.layouts}>
            {(layout) => (
              <div
                class={`group flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer mb-1 ${
                  props.activeId === layout.id && props.activeType === 'layout'
                    ? 'bg-orange-100 text-orange-700'
                    : 'hover:bg-gray-200'
                }`}
                onClick={() => props.onSelect(layout.id, 'layout')}
              >
                <span class="text-sm">{icons.layout}</span>
                <Show when={editingId() === layout.id} fallback={
                  <>
                    <span class="text-sm flex-1">{layout.title}</span>
                    <button
                      class="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-gray-700"
                      onClick={(e) => startEdit(e, layout.id, layout.title)}
                      title="Rename"
                    >
                      ✎
                    </button>
                  </>
                }>
                  <input
                    class="text-sm flex-1 px-1 border rounded"
                    value={editValue()}
                    onInput={(e) => setEditValue(e.currentTarget.value)}
                    onBlur={() => finishEdit(layout.id, 'layout')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') finishEdit(layout.id, 'layout')
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                    onClick={(e) => e.stopPropagation()}
                    autofocus
                  />
                </Show>
              </div>
            )}
          </For>
        </div>
      </div>
    </div>
  )
}

export default Sidebar