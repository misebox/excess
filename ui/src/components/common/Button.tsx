import { Component, JSX } from 'solid-js'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps {
  variant?: ButtonVariant
  size?: ButtonSize
  disabled?: boolean
  onClick?: (e: MouseEvent) => void
  children: JSX.Element
  class?: string
  type?: 'button' | 'submit' | 'reset'
}

const Button: Component<ButtonProps> = (props) => {
  const variant = props.variant || 'secondary'
  const size = props.size || 'md'
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 disabled:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-300',
    success: 'bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-300',
    ghost: 'text-gray-600 hover:bg-gray-100 disabled:text-gray-300'
  }
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2'
  }
  
  return (
    <button
      type={props.type || 'button'}
      class={`rounded transition-colors ${variantClasses[variant]} ${sizeClasses[size]} ${props.class || ''}`}
      disabled={props.disabled}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  )
}

export default Button