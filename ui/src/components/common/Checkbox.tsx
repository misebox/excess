import { Component, createSignal, createEffect, JSX, onMount } from 'solid-js'

interface CheckboxProps {
  checked: boolean | undefined
  onChange: (checked: boolean) => void
  label?: string
  class?: string
  disabled?: boolean
}

const Checkbox: Component<CheckboxProps> = (props) => {
  let inputRef: HTMLInputElement | undefined
  const [localChecked, setLocalChecked] = createSignal(props.checked || false)
  
  // Sync from props only when component mounts or prop changes from parent
  createEffect(() => {
    const currentChecked = props.checked || false
    // Only update if the value is different and we're not currently focused
    if (inputRef && document.activeElement !== inputRef) {
      setLocalChecked(currentChecked)
    }
  })

  onMount(() => {
    setLocalChecked(props.checked || false)
  })

  const handleChange: JSX.EventHandler<HTMLInputElement, Event> = (e) => {
    const newChecked = e.currentTarget.checked
    setLocalChecked(newChecked)
    props.onChange(newChecked)
  }

  return (
    <label class={`inline-flex items-center ${props.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
      <input
        ref={inputRef}
        type="checkbox"
        class={props.class || 'rounded border-gray-300 text-blue-600 focus:ring-blue-500'}
        checked={localChecked()}
        onChange={handleChange}
        disabled={props.disabled}
      />
      {props.label && (
        <span class="ml-2 text-sm">{props.label}</span>
      )}
    </label>
  )
}

export default Checkbox