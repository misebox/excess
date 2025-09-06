import { Component, JSX, Show } from 'solid-js'

interface CommonDialogProps {
  isOpen: boolean
  onClose: () => void
  title: string
  maxWidth?: string
  children: JSX.Element
  footer?: JSX.Element
}

const CommonDialog: Component<CommonDialogProps> = (props) => {
  return (
    <Show when={props.isOpen}>
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div 
          class={`bg-white rounded-lg ${props.maxWidth || 'max-w-2xl'} w-full max-h-[90vh] overflow-hidden flex flex-col`}
          onClick={(e) => e.stopPropagation()}
        >
          <div class="p-4 border-b flex items-center justify-between">
            <h2 class="text-xl font-bold">{props.title}</h2>
            <button
              class="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              onClick={props.onClose}
              aria-label="Close"
            >
              ×
            </button>
          </div>
          
          <div class="flex-1 overflow-y-auto p-4">
            {props.children}
          </div>
          
          <Show when={props.footer}>
            <div class="p-4 border-t">
              {props.footer}
            </div>
          </Show>
        </div>
      </div>
    </Show>
  )
}

export default CommonDialog