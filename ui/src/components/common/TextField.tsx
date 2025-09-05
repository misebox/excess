import { Component, createSignal, createEffect, JSX, onMount } from 'solid-js'

interface TextFieldProps {
  value: string | undefined
  onChange: (value: string) => void
  placeholder?: string
  class?: string
  type?: 'text' | 'number' | 'email' | 'password'
  disabled?: boolean
  autofocus?: boolean
  onEnter?: () => void
  onEscape?: () => void
  onBlur?: () => void
}

const TextField: Component<TextFieldProps> = (props) => {
  let inputRef: HTMLInputElement | undefined
  const [localValue, setLocalValue] = createSignal(props.value || '')
  
  // Sync from props only when component mounts or prop changes from parent
  createEffect(() => {
    const currentValue = props.value || ''
    // Only update if the value is different and we're not currently focused
    if (inputRef && document.activeElement !== inputRef) {
      setLocalValue(currentValue)
    }
  })

  onMount(() => {
    setLocalValue(props.value || '')
  })

  const handleInput: JSX.EventHandler<HTMLInputElement, InputEvent> = (e) => {
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
    // Optional: Select all text on focus for easier editing
  }

  const handleKeyDown: JSX.EventHandler<HTMLInputElement, KeyboardEvent> = (e) => {
    if (e.key === 'Enter') {
      commitValue()
      e.currentTarget.blur()
      props.onEnter?.()
    } else if (e.key === 'Escape') {
      // Reset to original value
      setLocalValue(props.value || '')
      e.currentTarget.blur()
      props.onEscape?.()
    }
  }

  return (
    <input
      ref={inputRef}
      type={props.type || 'text'}
      class={props.class || 'w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500'}
      value={localValue()}
      onInput={handleInput}
      onBlur={handleBlur}
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
      placeholder={props.placeholder}
      disabled={props.disabled}
      autofocus={props.autofocus}
    />
  )
}

export default TextField