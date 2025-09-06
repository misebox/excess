import { Component } from 'solid-js'
import CommonDialog from './CommonDialog'
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
    warning: 'primary' as const,
    info: 'primary' as const
  }[variant]
  
  const footer = (
    <div class="flex justify-end gap-3">
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
  )
  
  return (
    <CommonDialog
      isOpen={props.isOpen}
      onClose={props.onCancel}
      title={title}
      maxWidth="max-w-md"
      footer={footer}
    >
      <p class="text-gray-700">{props.message}</p>
    </CommonDialog>
  )
}

export default ConfirmDialog