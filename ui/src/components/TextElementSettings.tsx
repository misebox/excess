import { Component, createSignal, createEffect } from 'solid-js'
import { TextElementSettings } from '@/models/types'

interface TextElementSettingsDialogProps {
  isOpen: boolean
  settings: TextElementSettings | null
  onClose: () => void
  onSave: (settings: TextElementSettings) => void
}

const TextElementSettingsDialog: Component<TextElementSettingsDialogProps> = (props) => {
  const [content, setContent] = createSignal(props.settings?.content || '')
  const [fontSize, setFontSize] = createSignal(props.settings?.fontSize || 14)
  const [fontWeight, setFontWeight] = createSignal(props.settings?.fontWeight || 'normal')
  const [textAlign, setTextAlign] = createSignal<'left' | 'center' | 'right'>(props.settings?.textAlign || 'left')
  const [color, setColor] = createSignal(props.settings?.color || '#000000')
  const [backgroundColor, setBackgroundColor] = createSignal(props.settings?.backgroundColor || '#ffffff')
  const [padding, setPadding] = createSignal(props.settings?.padding || 8)
  const [fontFamily, setFontFamily] = createSignal(props.settings?.fontFamily || 'inherit')

  // Update state when props change
  createEffect(() => {
    if (props.isOpen && props.settings) {
      setContent(props.settings.content || '')
      setFontSize(props.settings.fontSize || 14)
      setFontWeight(props.settings.fontWeight || 'normal')
      setTextAlign(props.settings.textAlign || 'left')
      setColor(props.settings.color || '#000000')
      setBackgroundColor(props.settings.backgroundColor || '#ffffff')
      setPadding(props.settings.padding || 8)
      setFontFamily(props.settings.fontFamily || 'inherit')
    }
  })

  const fontWeights = [
    { value: '100', label: 'Thin' },
    { value: '300', label: 'Light' },
    { value: 'normal', label: 'Normal' },
    { value: '500', label: 'Medium' },
    { value: '600', label: 'Semibold' },
    { value: 'bold', label: 'Bold' },
    { value: '900', label: 'Black' }
  ]

  const fontFamilies = [
    { value: 'inherit', label: 'Default' },
    { value: 'sans-serif', label: 'Sans Serif' },
    { value: 'serif', label: 'Serif' },
    { value: 'monospace', label: 'Monospace' },
    { value: '"Times New Roman", Times, serif', label: 'Times New Roman' },
    { value: 'Georgia, serif', label: 'Georgia' },
    { value: '"Courier New", Courier, monospace', label: 'Courier New' },
    { value: 'Arial, sans-serif', label: 'Arial' },
    { value: '"Helvetica Neue", Helvetica, sans-serif', label: 'Helvetica' }
  ]

  const handleSave = () => {
    const settings: TextElementSettings = {
      content: content(),
      fontSize: fontSize(),
      fontWeight: fontWeight(),
      textAlign: textAlign(),
      color: color(),
      backgroundColor: backgroundColor(),
      padding: padding(),
      fontFamily: fontFamily()
    }
    props.onSave(settings)
    props.onClose()
  }

  const previewStyle = () => ({
    'font-size': `${fontSize()}px`,
    'font-weight': fontWeight(),
    'text-align': textAlign(),
    'color': color(),
    'background-color': backgroundColor(),
    'padding': `${padding()}px`,
    'font-family': fontFamily()
  })

  if (!props.isOpen) return null

  return (
    <div 
      class="fixed inset-0 bg-black/30 flex items-center justify-center" 
      style="z-index: 99999;"
      onKeyDown={(e) => e.stopPropagation()}
    >
      <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <div class="px-6 py-4 border-b">
          <h2 class="text-xl font-bold">Text Element Settings</h2>
        </div>
        
        <div class="flex-1 overflow-auto p-6 space-y-6">
          {/* Text Content */}
          <div>
            <h3 class="text-lg font-semibold mb-3">Content</h3>
            <textarea
              class="w-full px-3 py-2 border rounded resize-none"
              rows="4"
              value={content()}
              onInput={(e) => setContent(e.currentTarget.value)}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder="Enter text content..."
            />
          </div>

          {/* Typography */}
          <div>
            <h3 class="text-lg font-semibold mb-3">Typography</h3>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1">Font Size</label>
                <div class="flex items-center gap-2">
                  <input
                    type="range"
                    min="8"
                    max="72"
                    value={fontSize()}
                    onInput={(e) => setFontSize(parseInt(e.currentTarget.value))}
                    class="flex-1"
                  />
                  <input
                    type="number"
                    min="8"
                    max="72"
                    value={fontSize()}
                    onInput={(e) => setFontSize(parseInt(e.currentTarget.value))}
                    onKeyDown={(e) => e.stopPropagation()}
                    class="w-16 px-2 py-1 border rounded"
                  />
                  <span class="text-sm text-gray-600">px</span>
                </div>
              </div>
              
              <div>
                <label class="block text-sm font-medium mb-1">Font Weight</label>
                <select
                  class="w-full px-3 py-2 border rounded"
                  value={fontWeight()}
                  onChange={(e) => setFontWeight(e.currentTarget.value)}
                >
                  {fontWeights.map(weight => (
                    <option value={weight.value}>{weight.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium mb-1">Font Family</label>
                <select
                  class="w-full px-3 py-2 border rounded"
                  value={fontFamily()}
                  onChange={(e) => setFontFamily(e.currentTarget.value)}
                >
                  {fontFamilies.map(font => (
                    <option value={font.value}>{font.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium mb-1">Text Align</label>
                <div class="flex gap-2">
                  <button
                    class={`flex-1 px-3 py-2 border rounded ${
                      textAlign() === 'left' ? 'bg-blue-50 border-blue-500' : 'border-gray-300'
                    }`}
                    onClick={() => setTextAlign('left')}
                  >
                    Left
                  </button>
                  <button
                    class={`flex-1 px-3 py-2 border rounded ${
                      textAlign() === 'center' ? 'bg-blue-50 border-blue-500' : 'border-gray-300'
                    }`}
                    onClick={() => setTextAlign('center')}
                  >
                    Center
                  </button>
                  <button
                    class={`flex-1 px-3 py-2 border rounded ${
                      textAlign() === 'right' ? 'bg-blue-50 border-blue-500' : 'border-gray-300'
                    }`}
                    onClick={() => setTextAlign('right')}
                  >
                    Right
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Colors */}
          <div>
            <h3 class="text-lg font-semibold mb-3">Colors</h3>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1">Text Color</label>
                <div class="flex items-center gap-2">
                  <input
                    type="color"
                    value={color()}
                    onInput={(e) => setColor(e.currentTarget.value)}
                    class="w-12 h-8 border rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={color()}
                    onInput={(e) => setColor(e.currentTarget.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    class="flex-1 px-2 py-1 border rounded"
                    placeholder="#000000"
                  />
                </div>
              </div>
              
              <div>
                <label class="block text-sm font-medium mb-1">Background Color</label>
                <div class="flex items-center gap-2">
                  <input
                    type="color"
                    value={backgroundColor()}
                    onInput={(e) => setBackgroundColor(e.currentTarget.value)}
                    class="w-12 h-8 border rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={backgroundColor()}
                    onInput={(e) => setBackgroundColor(e.currentTarget.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    class="flex-1 px-2 py-1 border rounded"
                    placeholder="#ffffff"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Spacing */}
          <div>
            <h3 class="text-lg font-semibold mb-3">Spacing</h3>
            <div>
              <label class="block text-sm font-medium mb-1">Padding</label>
              <div class="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="32"
                  value={padding()}
                  onInput={(e) => setPadding(parseInt(e.currentTarget.value))}
                  class="flex-1"
                />
                <input
                  type="number"
                  min="0"
                  max="32"
                  value={padding()}
                  onInput={(e) => setPadding(parseInt(e.currentTarget.value))}
                  onKeyDown={(e) => e.stopPropagation()}
                  class="w-16 px-2 py-1 border rounded"
                />
                <span class="text-sm text-gray-600">px</span>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div>
            <h3 class="text-lg font-semibold mb-3">Preview</h3>
            <div class="border rounded p-4 bg-gray-50">
              <div 
                class="rounded"
                style={previewStyle()}
              >
                {content() || 'Your text will appear here...'}
              </div>
            </div>
          </div>
        </div>
        
        <div class="px-6 py-4 border-t flex justify-end gap-3">
          <button
            class="px-4 py-2 text-gray-600 hover:text-gray-800"
            onClick={props.onClose}
          >
            Cancel
          </button>
          <button
            class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={handleSave}
          >
            Apply Settings
          </button>
        </div>
      </div>
    </div>
  )
}

export default TextElementSettingsDialog