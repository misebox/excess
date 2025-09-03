import { Component, For, createSignal, onMount, onCleanup, Show } from 'solid-js'
import { Layout, LayoutElement } from '../models/types'

interface LayoutBuilderProps {
  layout: Layout
  onUpdate: (layout: Layout) => void
}

const GRID_SIZE = 30 // pixels per grid cell
const GRID_COLS = 40
const GRID_ROWS = 30

const LayoutBuilder: Component<LayoutBuilderProps> = (props) => {
  const [dragging, setDragging] = createSignal<string | null>(null)
  const [resizing, setResizing] = createSignal<string | null>(null)
  const [dragOffset, setDragOffset] = createSignal({ x: 0, y: 0 })
  const [resizeStart, setResizeStart] = createSignal({ width: 0, height: 0, x: 0, y: 0 })
  const [isDragOver, setIsDragOver] = createSignal(false)
  const [dropPreview, setDropPreview] = createSignal<{x: number, y: number} | null>(null)
  
  let containerRef: HTMLDivElement | undefined

  const addElement = (type: string, data: any = null, position?: { col: number, row: number }) => {
    const newElement: LayoutElement = {
      id: `elem_${Date.now()}`,
      type: type as any,
      gridPosition: position || { col: Math.floor(Math.random() * 10), row: Math.floor(Math.random() * 10) },
      gridSize: { cols: 6, rows: 4 },
      data: data
    }
    props.onUpdate({
      ...props.layout,
      elements: [...props.layout.elements, newElement]
    })
  }

  const handleMouseDown = (e: MouseEvent, elementId: string, isResize: boolean = false) => {
    e.preventDefault()
    e.stopPropagation()
    
    const element = props.layout.elements.find(el => el.id === elementId)
    if (!element) return

    if (isResize) {
      setResizing(elementId)
      setResizeStart({
        width: element.gridSize.cols,
        height: element.gridSize.rows,
        x: e.clientX,
        y: e.clientY
      })
    } else {
      setDragging(elementId)
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      })
    }
  }

  const handleMouseMove = (e: MouseEvent) => {
    const dragId = dragging()
    const resizeId = resizing()
    
    if (dragId && containerRef) {
      const rect = containerRef.getBoundingClientRect()
      const x = e.clientX - rect.left - dragOffset().x
      const y = e.clientY - rect.top - dragOffset().y
      
      const col = Math.max(0, Math.min(GRID_COLS - 1, Math.floor(x / GRID_SIZE)))
      const row = Math.max(0, Math.min(GRID_ROWS - 1, Math.floor(y / GRID_SIZE)))
      
      const element = props.layout.elements.find(el => el.id === dragId)
      if (element) {
        const maxCol = GRID_COLS - element.gridSize.cols
        const maxRow = GRID_ROWS - element.gridSize.rows
        
        props.onUpdate({
          ...props.layout,
          elements: props.layout.elements.map(el =>
            el.id === dragId
              ? { ...el, gridPosition: { col: Math.min(col, maxCol), row: Math.min(row, maxRow) } }
              : el
          )
        })
      }
    }
    
    if (resizeId) {
      const element = props.layout.elements.find(el => el.id === resizeId)
      if (element) {
        const deltaX = e.clientX - resizeStart().x
        const deltaY = e.clientY - resizeStart().y
        
        const newCols = Math.max(2, Math.floor(resizeStart().width + deltaX / GRID_SIZE))
        const newRows = Math.max(2, Math.floor(resizeStart().height + deltaY / GRID_SIZE))
        
        const maxCols = GRID_COLS - element.gridPosition.col
        const maxRows = GRID_ROWS - element.gridPosition.row
        
        props.onUpdate({
          ...props.layout,
          elements: props.layout.elements.map(el =>
            el.id === resizeId
              ? { ...el, gridSize: { cols: Math.min(newCols, maxCols), rows: Math.min(newRows, maxRows) } }
              : el
          )
        })
      }
    }
  }

  const handleMouseUp = () => {
    setDragging(null)
    setResizing(null)
  }

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    e.dataTransfer!.dropEffect = 'copy'
    
    if (containerRef) {
      const rect = containerRef.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      
      const col = Math.floor(x / GRID_SIZE)
      const row = Math.floor(y / GRID_SIZE)
      
      setDropPreview({ x: col * GRID_SIZE, y: row * GRID_SIZE })
    }
    
    setIsDragOver(true)
  }

  const handleDragLeave = (e: DragEvent) => {
    // Only set isDragOver to false if we're leaving the container entirely
    if (e.target === containerRef) {
      setIsDragOver(false)
      setDropPreview(null)
    }
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    
    try {
      const data = JSON.parse(e.dataTransfer!.getData('application/json'))
      
      if (containerRef) {
        const rect = containerRef.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        
        const col = Math.max(0, Math.min(GRID_COLS - 6, Math.floor(x / GRID_SIZE)))
        const row = Math.max(0, Math.min(GRID_ROWS - 4, Math.floor(y / GRID_SIZE)))
        
        addElement(data.type, data, { col, row })
      }
    } catch (error) {
      console.error('Failed to handle drop:', error)
    }
    
    setIsDragOver(false)
    setDropPreview(null)
  }

  onMount(() => {
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  })

  onCleanup(() => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  })

  const removeElement = (id: string) => {
    props.onUpdate({
      ...props.layout,
      elements: props.layout.elements.filter(el => el.id !== id)
    })
  }

  const getElementTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      table: '⊞',
      view: '👁',
      function: 'ƒ',
      text: 'T',
      chart: '📊'
    }
    return icons[type] || '?'
  }

  const getElementDisplayName = (element: LayoutElement) => {
    if (element.data) {
      return element.data.title || element.data.name || element.type
    }
    return element.type
  }

  return (
    <div class="p-4 h-full flex flex-col">
      <h2 class="text-xl font-bold mb-4">{props.layout.title}</h2>
      
      <div class="mb-4 flex gap-2">
        <button
          class="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => addElement('table')}
        >
          + Table
        </button>
        <button
          class="px-3 py-1.5 text-sm bg-green-500 text-white rounded hover:bg-green-600"
          onClick={() => addElement('view')}
        >
          + View
        </button>
        <button
          class="px-3 py-1.5 text-sm bg-purple-500 text-white rounded hover:bg-purple-600"
          onClick={() => addElement('function')}
        >
          + Function
        </button>
        <button
          class="px-3 py-1.5 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
          onClick={() => addElement('text')}
        >
          + Text
        </button>
        <button
          class="px-3 py-1.5 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600"
          onClick={() => addElement('chart')}
        >
          + Chart
        </button>
      </div>
      
      <div 
        ref={containerRef}
        class={`flex-1 relative bg-white border-2 rounded overflow-auto transition-colors ${
          isDragOver() ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
        style={{
          "background-image": `
            linear-gradient(to right, ${isDragOver() ? '#dbeafe' : '#e5e7eb'} 1px, transparent 1px),
            linear-gradient(to bottom, ${isDragOver() ? '#dbeafe' : '#e5e7eb'} 1px, transparent 1px)
          `,
          "background-size": `${GRID_SIZE}px ${GRID_SIZE}px`,
          "min-height": `${GRID_ROWS * GRID_SIZE}px`,
          "min-width": `${GRID_COLS * GRID_SIZE}px`
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <For each={props.layout.elements}>
          {(element) => (
            <div
              class={`absolute bg-white border-2 rounded shadow-md transition-shadow ${
                dragging() === element.id ? 'shadow-xl opacity-80' : 'hover:shadow-lg'
              } ${resizing() === element.id ? 'border-blue-500' : 'border-gray-400'}`}
              style={{
                left: `${element.gridPosition.col * GRID_SIZE}px`,
                top: `${element.gridPosition.row * GRID_SIZE}px`,
                width: `${element.gridSize.cols * GRID_SIZE}px`,
                height: `${element.gridSize.rows * GRID_SIZE}px`,
                cursor: dragging() === element.id ? 'grabbing' : 'grab'
              }}
              onMouseDown={(e) => handleMouseDown(e, element.id)}
            >
              <div class="p-2 h-full flex flex-col">
                <div class="flex items-center justify-between mb-1">
                  <div class="flex items-center gap-2">
                    <span class="text-lg">{getElementTypeIcon(element.type)}</span>
                    <span class="text-sm font-medium">{getElementDisplayName(element)}</span>
                  </div>
                  <button
                    class="text-red-500 hover:text-red-700 px-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeElement(element.id)
                    }}
                  >
                    ×
                  </button>
                </div>
                <div class="flex-1 flex items-center justify-center text-xs text-gray-400">
                  {element.gridSize.cols}×{element.gridSize.rows}
                </div>
              </div>
              
              {/* Resize handle */}
              <div
                class="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 rounded-tl cursor-nwse-resize"
                style={{
                  "clip-path": "polygon(100% 0, 100% 100%, 0 100%)"
                }}
                onMouseDown={(e) => handleMouseDown(e, element.id, true)}
              />
            </div>
          )}
        </For>
        
        <Show when={dropPreview()}>
          <div
            class="absolute border-2 border-blue-500 bg-blue-100 opacity-50 rounded pointer-events-none"
            style={{
              left: `${dropPreview()!.x}px`,
              top: `${dropPreview()!.y}px`,
              width: `${6 * GRID_SIZE}px`,
              height: `${4 * GRID_SIZE}px`
            }}
          />
        </Show>
      </div>
    </div>
  )
}

export default LayoutBuilder