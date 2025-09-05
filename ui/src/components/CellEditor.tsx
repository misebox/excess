import { createSignal, onMount } from 'solid-js'
import type { Component } from 'solid-js'

interface CellEditorProps {
  initialValue: any
  onSave: (value: string) => void
  onCancel: () => void
}

const CellEditor: Component<CellEditorProps> = (props) => {
  const [value, setValue] = createSignal(String(props.initialValue ?? ''))
  let inputRef: HTMLInputElement
  let isCommitted = false

  onMount(() => {
    // Use setTimeout to ensure the DOM is ready
    setTimeout(() => {
      if (inputRef) {
        inputRef.focus()
        inputRef.select()
      }
    }, 0)
  })

  const handleCommit = () => {
    if (!isCommitted) {
      isCommitted = true
      props.onSave(value())
    }
  }

  const handleCancel = () => {
    if (!isCommitted) {
      isCommitted = true
      props.onCancel()
    }
  }

  return (
    <input
      ref={(el) => {
        inputRef = el
        // Focus immediately when the element is created
        if (el) {
          el.focus()
          el.select()
        }
      }}
      type="text"
      class="w-full px-1 py-0.5 border rounded bg-white"
      value={value()}
      onInput={(e) => setValue(e.currentTarget.value)}
      onBlur={handleCommit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          handleCommit()
        } else if (e.key === 'Escape') {
          e.preventDefault()
          handleCancel()
        } else if (e.key === 'Tab') {
          // Allow Tab to trigger blur naturally, which will save
          // Don't prevent default so tab navigation works
        }
      }}
    />
  )
}

export default CellEditor