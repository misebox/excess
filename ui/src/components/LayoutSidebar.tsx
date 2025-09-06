import { Component, For, Show, createSignal } from 'solid-js'
import { LayoutElement } from '@/models/types'

interface LayoutSidebarProps {
  elements: LayoutElement[]
  selectedElementId?: string | null
  onSelectElement: (elementId: string) => void
  onDeleteElement: (elementId: string) => void
  onReorderElements: (elements: LayoutElement[]) => void
  onToggleVisibility?: (elementId: string) => void
}

const LayoutSidebar: Component<LayoutSidebarProps> = (props) => {
  const [isExpanded, setIsExpanded] = createSignal(true)
  const [draggedElement, setDraggedElement] = createSignal<string | null>(null)
  const [dragOverElement, setDragOverElement] = createSignal<string | null>(null)

  const getElementIcon = (type: string) => {
    switch (type) {
      case 'text': return '📝'
      case 'tableView': return '📊'
      case 'chart': return '📈'
      case 'table': return '🗂️'
      case 'view': return '👁️'
      case 'function': return '⚙️'
      default: return '📦'
    }
  }

  const getElementLabel = (element: LayoutElement) => {
    if (element.type === 'text') {
      return element.data?.content?.substring(0, 20) + (element.data?.content?.length > 20 ? '...' : '') || 'Text'
    }
    if (element.type === 'tableView') {
      return element.data?.settings?.tableId || 'Table View'
    }
    if (element.type === 'chart') {
      return element.data?.settings?.title || 'Chart'
    }
    return element.type
  }

  const handleDragStart = (e: DragEvent, elementId: string) => {
    console.log('handleDragStart:', elementId)
    setDraggedElement(elementId)
    e.dataTransfer!.effectAllowed = 'move'
    e.dataTransfer!.setData('text/plain', elementId)
  }

  const handleDragOver = (e: DragEvent, elementId: string) => {
    e.preventDefault()
    e.dataTransfer!.dropEffect = 'move'
    setDragOverElement(elementId)
  }

  const handleDragLeave = () => {
    setDragOverElement(null)
  }

  const handleDrop = (e: DragEvent, targetId: string) => {
    e.preventDefault()
    e.stopPropagation()
    const sourceId = draggedElement()
    
    console.log('handleDrop:', { sourceId, targetId })
    
    if (sourceId && sourceId !== targetId) {
      const elements = [...props.elements]
      const sourceIndex = elements.findIndex(el => el.id === sourceId)
      const targetIndex = elements.findIndex(el => el.id === targetId)
      
      console.log('Reordering:', { sourceIndex, targetIndex })
      console.log('Before reorder:', elements.map(e => e.id))
      
      if (sourceIndex !== -1 && targetIndex !== -1) {
        // Remove the source element
        const [movedElement] = elements.splice(sourceIndex, 1)
        // Insert at the target position
        elements.splice(targetIndex, 0, movedElement)
        console.log('After reorder:', elements.map(e => e.id))
        props.onReorderElements(elements)
      }
    }
    
    setDraggedElement(null)
    setDragOverElement(null)
  }

  const handleDragEnd = () => {
    setDraggedElement(null)
    setDragOverElement(null)
  }

  // Display elements in order (first in array = back layer, last in array = front layer)
  // So we show them with the last element (front) at the top of the list
  const displayElements = () => [...props.elements].reverse()

  return (
    <div class="h-full flex flex-col bg-gray-50 border-r">
      <div class="p-3 border-b bg-white">
        <button
          class="w-full flex items-center justify-between text-sm font-medium"
          onClick={() => setIsExpanded(!isExpanded())}
        >
          <span class="flex items-center gap-2">
            <span class={`transition-transform ${isExpanded() ? 'rotate-90' : ''}`}>▶</span>
            Layout Elements ({props.elements.length})
          </span>
        </button>
      </div>
      
      <Show when={isExpanded()}>
        <div class="flex-1 overflow-y-auto">
          <Show when={props.elements.length === 0}>
            <div class="p-4 text-center text-gray-500 text-sm">
              No elements in layout
            </div>
          </Show>
          
          <div class="p-2 space-y-1">
            <For each={displayElements()}>
              {(element, index) => (
                <div
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, element.id)}
                  onDragOver={(e) => handleDragOver(e, element.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, element.id)}
                  onDragEnd={handleDragEnd}
                  class={`
                    group flex items-center gap-2 p-2 rounded cursor-move transition-colors
                    ${props.selectedElementId === element.id ? 'bg-blue-100 border-blue-300' : 'hover:bg-gray-100'}
                    ${dragOverElement() === element.id ? 'border-t-2 border-blue-500' : ''}
                    ${draggedElement() === element.id ? 'opacity-50' : ''}
                  `}
                  onClick={() => props.onSelectElement(element.id)}
                >
                  <span class="text-gray-400 text-xs w-4">{props.elements.findIndex(el => el.id === element.id) + 1}</span>
                  <span class="text-lg">{getElementIcon(element.type)}</span>
                  <span class="flex-1 text-sm truncate">{getElementLabel(element)}</span>
                  
                  <div class="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                    <Show when={props.onToggleVisibility}>
                      <button
                        class="p-1 hover:bg-gray-200 rounded"
                        onClick={(e) => {
                          e.stopPropagation()
                          props.onToggleVisibility?.(element.id)
                        }}
                        title="Toggle visibility"
                      >
                        👁️
                      </button>
                    </Show>
                    <button
                      class="p-1 hover:bg-red-100 text-red-500 rounded"
                      onClick={(e) => {
                        e.stopPropagation()
                        props.onDeleteElement(element.id)
                      }}
                      title="Delete"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
            </For>
          </div>
          
          <div class="p-3 border-t text-xs text-gray-500">
            <div class="space-y-1">
              <div>🔹 Drag to reorder</div>
              <div>🔹 Top = Front layer</div>
              <div>🔹 Bottom = Back layer</div>
            </div>
          </div>
        </div>
      </Show>
    </div>
  )
}

export default LayoutSidebar