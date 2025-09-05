import { Component, Show, For } from 'solid-js'
import Button from './common/Button'
import { tableTemplates, TableTemplate } from '../data/tableTemplates'

interface TemplateSelectDialogProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (template: TableTemplate) => void
}

const TemplateSelectDialog: Component<TemplateSelectDialogProps> = (props) => {
  return (
    <Show when={props.isOpen}>
      <div 
        class="fixed inset-0 bg-black/30 flex items-center justify-center" 
        style="z-index: 100000;"
        onClick={props.onClose}
      >
        <div 
          class="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[80vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div class="px-6 py-4 border-b">
            <h3 class="text-lg font-semibold">Select Table Template</h3>
            <p class="text-sm text-gray-600 mt-1">Choose a template to apply its structure to your table</p>
          </div>
          
          <div class="flex-1 overflow-auto px-6 py-4">
            <div class="grid gap-3">
              <For each={tableTemplates}>
                {(template) => (
                  <div 
                    class="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => {
                      props.onSelect(template)
                      props.onClose()
                    }}
                  >
                    <h4 class="font-medium text-gray-900">{template.name}</h4>
                    <p class="text-sm text-gray-600 mt-1">{template.description}</p>
                    <div class="mt-2 text-xs text-gray-500">
                      <span class="inline-block bg-gray-100 rounded px-2 py-1 mr-2">
                        {template.columns.length} columns
                      </span>
                      {template.indexes && template.indexes.length > 0 && (
                        <span class="inline-block bg-gray-100 rounded px-2 py-1 mr-2">
                          {template.indexes.length} indexes
                        </span>
                      )}
                      {template.uniqueConstraints && template.uniqueConstraints.length > 0 && (
                        <span class="inline-block bg-gray-100 rounded px-2 py-1">
                          {template.uniqueConstraints.length} unique constraints
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </For>
            </div>
          </div>
          
          <div class="px-6 py-4 border-t">
            <Button
              variant="ghost"
              onClick={props.onClose}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </Show>
  )
}

export default TemplateSelectDialog