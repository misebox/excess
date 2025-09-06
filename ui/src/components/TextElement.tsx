import { Component, createSignal, Show } from 'solid-js'

interface TextElementProps {
  content: string
  onUpdate: (content: string) => void
  fontSize?: number
  fontWeight?: string
  textAlign?: 'left' | 'center' | 'right'
  color?: string
}

const TextElement: Component<TextElementProps> = (props) => {
  const [isEditing, setIsEditing] = createSignal(false)
  const [editContent, setEditContent] = createSignal(props.content || '')
  let textareaRef: HTMLTextAreaElement | undefined

  const handleStartEdit = () => {
    setEditContent(props.content || '')
    setIsEditing(true)
    setTimeout(() => {
      if (textareaRef) {
        textareaRef.focus()
        textareaRef.select()
      }
    }, 0)
  }

  const handleSave = () => {
    props.onUpdate(editContent())
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditContent(props.content || '')
    setIsEditing(false)
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSave()
    }
  }

  const style = {
    'font-size': props.fontSize ? `${props.fontSize}px` : '14px',
    'font-weight': props.fontWeight || 'normal',
    'text-align': props.textAlign || 'left',
    'color': props.color || '#000000'
  }

  return (
    <div class="h-full w-full p-2 overflow-auto">
      <Show when={isEditing()}>
        <div class="h-full flex flex-col">
          <textarea
            ref={textareaRef}
            value={editContent()}
            onInput={(e) => setEditContent(e.currentTarget.value)}
            onKeyDown={handleKeyDown}
            class="flex-1 w-full p-2 border border-blue-500 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={style}
            placeholder="Enter text..."
          />
          <div class="flex justify-end gap-2 mt-2">
            <button
              class="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
              onClick={handleCancel}
            >
              Cancel (Esc)
            </button>
            <button
              class="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={handleSave}
            >
              Save (Ctrl+Enter)
            </button>
          </div>
        </div>
      </Show>
      <Show when={!isEditing()}>
        <div
          class="h-full w-full cursor-pointer hover:bg-gray-50 rounded p-2"
          style={style}
          onClick={handleStartEdit}
          title="Click to edit"
        >
          {props.content || (
            <span class="text-gray-400 italic">Click to add text...</span>
          )}
        </div>
      </Show>
    </div>
  )
}

export default TextElement