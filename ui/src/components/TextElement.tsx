import { Component, Show } from 'solid-js'

interface TextElementProps {
  content: string
  onSettingsClick?: () => void
  fontSize?: number
  fontWeight?: string
  textAlign?: 'left' | 'center' | 'right'
  color?: string
  backgroundColor?: string
  padding?: number
  fontFamily?: string
}

const TextElement: Component<TextElementProps> = (props) => {
  const style = {
    'font-size': props.fontSize ? `${props.fontSize}px` : '14px',
    'font-weight': props.fontWeight || 'normal',
    'text-align': props.textAlign || 'left',
    'color': props.color || '#000000',
    'background-color': props.backgroundColor || 'transparent',
    'padding': props.padding ? `${props.padding}px` : '8px',
    'font-family': props.fontFamily || 'inherit',
    'white-space': 'pre-wrap',
    'word-break': 'break-word'
  }

  return (
    <div class="h-full w-full overflow-auto relative">
      <Show when={props.onSettingsClick}>
        <button
          class="absolute top-2 right-2 p-1 hover:bg-gray-200 rounded z-10 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            if (props.onSettingsClick) {
              props.onSettingsClick()
            }
          }}
          title="Settings"
        >
          ⚙️
        </button>
      </Show>
      <div
        class="h-full w-full rounded"
        style={style}
      >
        <Show when={props.content} fallback={
          <span class="text-gray-400 italic">Click settings to add text...</span>
        }>
          {props.content}
        </Show>
      </div>
    </div>
  )
}

export default TextElement