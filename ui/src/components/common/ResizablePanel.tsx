import { Component, JSX, createSignal, onMount } from 'solid-js'

interface ResizablePanelProps {
  children: JSX.Element
  initialWidth?: number
  minWidth?: number
  maxWidth?: number
  side?: 'left' | 'right'
  class?: string
  onResize?: (width: number) => void
}

const ResizablePanel: Component<ResizablePanelProps> = (props) => {
  const [width, setWidth] = createSignal(props.initialWidth || 256)
  const [isResizing, setIsResizing] = createSignal(false)
  
  const minWidth = props.minWidth || 200
  const maxWidth = props.maxWidth || 480
  const side = props.side || 'left'

  const handleMouseDown = (e: MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
    
    const startX = e.clientX
    const startWidth = width()
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing()) return
      
      const diff = e.clientX - startX
      const newWidth = side === 'left' 
        ? Math.max(minWidth, Math.min(maxWidth, startWidth + diff))
        : Math.max(minWidth, Math.min(maxWidth, startWidth - diff))
      
      setWidth(newWidth)
      props.onResize?.(newWidth)
    }
    
    const handleMouseUp = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  return (
    <>
      <div 
        class={`overflow-y-auto relative ${props.class || ''}`}
        style={{ width: `${width()}px` }}
      >
        {props.children}
      </div>
      
      {/* Resize handle */}
      <div
        class={`w-1 bg-gray-300 hover:bg-blue-500 cursor-col-resize transition-colors ${
          isResizing() ? 'bg-blue-500' : ''
        }`}
        onMouseDown={handleMouseDown}
        style={{ "user-select": "none" }}
      />
    </>
  )
}

export default ResizablePanel