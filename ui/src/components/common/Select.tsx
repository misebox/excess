import { Component, createSignal, createEffect, JSX, onMount, For } from 'solid-js'

interface SelectProps<T extends string> {
  value: T | undefined
  onChange: (value: T) => void
  options: readonly T[] | T[]
  placeholder?: string
  class?: string
  disabled?: boolean
  renderOption?: (option: T) => string
}

function Select<T extends string>(props: SelectProps<T>): JSX.Element {
  let selectRef: HTMLSelectElement | undefined
  const [localValue, setLocalValue] = createSignal(props.value || '')
  
  // Sync from props only when component mounts or prop changes from parent
  createEffect(() => {
    const currentValue = props.value || ''
    // Only update if the value is different and we're not currently focused
    if (selectRef && document.activeElement !== selectRef) {
      setLocalValue(currentValue)
    }
  })

  onMount(() => {
    setLocalValue(props.value || '')
  })

  const handleChange: JSX.EventHandler<HTMLSelectElement, Event> = (e) => {
    const newValue = e.currentTarget.value as T
    setLocalValue(newValue)
    props.onChange(newValue)
  }

  return (
    <select
      ref={selectRef}
      class={props.class || 'w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500'}
      value={localValue()}
      onChange={handleChange}
      disabled={props.disabled}
    >
      {props.placeholder && (
        <option value="" disabled>{props.placeholder}</option>
      )}
      <For each={props.options}>
        {(option) => (
          <option value={option}>
            {props.renderOption ? props.renderOption(option) : option}
          </option>
        )}
      </For>
    </select>
  )
}

export default Select