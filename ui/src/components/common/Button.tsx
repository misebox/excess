import { Component, JSX, Show } from 'solid-js'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'ghost'
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg'

interface ButtonProps {
  onClick?: () => void
  variant?: ButtonVariant
  size?: ButtonSize
  disabled?: boolean
  class?: string
  children: JSX.Element
  type?: 'button' | 'submit' | 'reset'
  title?: string
}

const Button: Component<ButtonProps> = (props) => {
  const variantClasses = {
    primary: 'bg-blue-500 text-white hover:bg-blue-600 disabled:bg-blue-300',
    secondary: 'bg-gray-500 text-white hover:bg-gray-600 disabled:bg-gray-300',
    danger: 'bg-red-500 text-white hover:bg-red-600 disabled:bg-red-300',
    success: 'bg-green-500 text-white hover:bg-green-600 disabled:bg-green-300',
    warning: 'bg-orange-500 text-white hover:bg-orange-600 disabled:bg-orange-300',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 disabled:opacity-50'
  }

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }

  const variant = props.variant || 'primary'
  const size = props.size || 'md'

  const baseClasses = 'rounded font-medium transition-colors disabled:cursor-not-allowed'
  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${props.class || ''}`

  return (
    <button
      type={props.type || 'button'}
      class={combinedClasses}
      onClick={props.onClick}
      disabled={props.disabled}
      title={props.title}
    >
      {props.children}
    </button>
  )
}

export default Button