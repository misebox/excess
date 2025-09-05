import { Component, createSignal, onMount, Show } from 'solid-js'

interface DateTimeEditorProps {
  initialValue: string | null
  onSave: (value: string | null) => void
  onCancel: () => void
  type: 'date' | 'datetime'
}

const DateTimeEditor: Component<DateTimeEditorProps> = (props) => {
  // Parse initial value or use current date/time
  const parseInitialValue = () => {
    if (props.initialValue) {
      return props.initialValue
    }
    const now = new Date()
    if (props.type === 'date') {
      return now.toISOString().split('T')[0]
    }
    return now.toISOString().slice(0, 16) // Format for datetime-local
  }

  const [value, setValue] = createSignal(parseInitialValue())
  const [showPicker, setShowPicker] = createSignal(false)
  let inputRef: HTMLInputElement
  let containerRef: HTMLDivElement

  onMount(() => {
    // Focus the input when mounted
    setTimeout(() => {
      if (inputRef) {
        inputRef.focus()
        inputRef.select()
      }
    }, 0)
  })

  const handleSetNow = () => {
    const now = new Date()
    let newValue: string
    if (props.type === 'date') {
      newValue = now.toISOString().split('T')[0]
    } else {
      // Format for datetime-local input
      newValue = now.toISOString().slice(0, 16)
    }
    setValue(newValue)
    if (inputRef) {
      inputRef.value = newValue
    }
  }

  const handleClear = () => {
    setValue('')
    if (inputRef) {
      inputRef.value = ''
    }
  }

  const handleSave = () => {
    const finalValue = value()
    if (finalValue === '') {
      props.onSave(null)
    } else {
      // Convert to ISO string for storage
      if (props.type === 'datetime' && finalValue) {
        const date = new Date(finalValue)
        props.onSave(date.toISOString())
      } else {
        props.onSave(finalValue)
      }
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      props.onCancel()
    } else if (e.key === 'Tab') {
      handleSave()
    }
  }

  const handleBlur = (e: FocusEvent) => {
    // Check if the new focused element is within our container
    const relatedTarget = e.relatedTarget as HTMLElement
    if (!containerRef?.contains(relatedTarget)) {
      handleSave()
    }
  }

  const formatDisplayValue = (val: string | null): string => {
    if (!val) return ''
    
    try {
      const date = new Date(val)
      if (isNaN(date.getTime())) return val
      
      if (props.type === 'date') {
        return date.toLocaleDateString()
      } else {
        return date.toLocaleString()
      }
    } catch {
      return val
    }
  }

  return (
    <div 
      ref={containerRef!}
      class="relative flex items-center gap-1 w-full"
    >
      <input
        ref={inputRef!}
        type={props.type === 'date' ? 'date' : 'datetime-local'}
        value={value()}
        onInput={(e) => setValue(e.currentTarget.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        class="flex-1 px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        style={{ "min-width": "150px" }}
      />
      
      <div class="flex gap-0.5">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleSetNow}
          class="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none"
          title={props.type === 'date' ? 'Today' : 'Now'}
        >
          {props.type === 'date' ? '📅' : '🕐'}
        </button>
        
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleClear}
          class="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 focus:outline-none"
          title="Clear"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

export default DateTimeEditor