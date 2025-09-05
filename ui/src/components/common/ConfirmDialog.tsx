import { Component, Show } from 'solid-js'
import Button from './Button'

interface ConfirmDialogProps {
  isOpen: boolean
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  variant?: 'danger' | 'warning' | 'info'
}

const ConfirmDialog: Component<ConfirmDialogProps> = (props) => {
  const title = props.title || 'Confirm'
  const confirmText = props.confirmText || 'Confirm'
  const cancelText = props.cancelText || 'Cancel'
  const variant = props.variant || 'danger'
  
  const confirmButtonVariant = {
    danger: 'danger' as const,
    warning: 'warning' as const,
    info: 'primary' as const
  }[variant]
  
  return (
    <Show when={props.isOpen}>
      <div 
        class="fixed inset-0 bg-black/30 flex items-center justify-center" 
        style="z-index: 100000;"
        onClick={props.onCancel}
      >
        <div 
          class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div class="px-6 py-4 border-b">
            <h3 class="text-lg font-semibold">{title}</h3>
          </div>
          
          <div class="px-6 py-4">
            <p class="text-gray-700">{props.message}</p>
          </div>
          
          <div class="px-6 py-4 border-t flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={props.onCancel}
            >
              {cancelText}
            </Button>
            <Button
              variant={confirmButtonVariant}
              onClick={props.onConfirm}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </Show>
  )
}

export default ConfirmDialog