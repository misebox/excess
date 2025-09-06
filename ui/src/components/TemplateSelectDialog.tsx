import { Component, Show, For } from 'solid-js'
import { Button, CommonDialog } from './common'
import { tableTemplates, TableTemplate } from '../data/tableTemplates'

interface TemplateSelectDialogProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (template: TableTemplate) => void
}

const TemplateSelectDialog: Component<TemplateSelectDialogProps> = (props) => {
  const footer = (
    <Button
      variant="ghost"
      onClick={props.onClose}
    >
      Cancel
    </Button>
  )

  return (
    <CommonDialog
      isOpen={props.isOpen}
      onClose={props.onClose}
      title="Select Table Template"
      maxWidth="max-w-3xl"
      footer={footer}
    >
      <p class="text-sm text-gray-600 mb-4">Choose a template to apply its structure to your table</p>
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
    </CommonDialog>
  )
}

export default TemplateSelectDialog