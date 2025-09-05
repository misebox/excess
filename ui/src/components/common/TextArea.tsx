import { Component, createSignal, createEffect, JSX, onMount } from 'solid-js'

interface TextAreaProps {
  value: string | undefined
  onChange: (value: string) => void
  placeholder?: string
  class?: string
  rows?: number
  disabled?: boolean
  autofocus?: boolean
  onBlur?: () => void
}

const TextArea: Component<TextAreaProps> = (props) => {
  let textareaRef: HTMLTextAreaElement | undefined
  const [localValue, setLocalValue] = createSignal(props.value || '')
  
  // Sync from props only when component mounts or prop changes from parent
  createEffect(() => {
    const currentValue = props.value || ''
    // Only update if the value is different and we're not currently focused
    if (textareaRef && document.activeElement !== textareaRef) {
      setLocalValue(currentValue)
    }
  })

  onMount(() => {
    setLocalValue(props.value || '')
  })

  const handleInput: JSX.EventHandler<HTMLTextAreaElement, InputEvent> = (e) => {
    const newValue = e.currentTarget.value
    setLocalValue(newValue)
    // Don't call onChange here - it causes re-renders that break typing
  }

  const commitValue = () => {
    const currentValue = localValue()
    if (currentValue !== (props.value || '')) {
      props.onChange(currentValue)
    }
  }

  const handleBlur = () => {
    commitValue()
    props.onBlur?.()
  }

  const handleFocus = () => {
    // Optional: select all text on focus
  }

  const handleKeyDown: JSX.EventHandler<HTMLTextAreaElement, KeyboardEvent> = (e) => {
    if (e.key === 'Escape') {
      // Reset to original value
      setLocalValue(props.value || '')
      e.currentTarget.blur()
    }
  }

  return (
    <textarea
      ref={textareaRef}
      class={props.class || 'w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500'}
      value={localValue()}
      onInput={handleInput}
      onBlur={handleBlur}
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
      placeholder={props.placeholder}
      disabled={props.disabled}
      autofocus={props.autofocus}
      rows={props.rows || 3}
    />
  )
}

export default TextArea