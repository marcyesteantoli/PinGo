import { ActivityIndicator, Text, TouchableOpacity } from 'react-native'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps {
  onPress?: () => void
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  disabled?: boolean
  children: string
  className?: string
}

const variantClasses: Record<ButtonVariant, { container: string; text: string; spinner: string }> = {
  primary: {
    container: 'bg-primary-500 active:bg-primary-600',
    text: 'text-white',
    spinner: '#ffffff',
  },
  secondary: {
    container: 'bg-secondary-500 active:bg-secondary-600',
    text: 'text-white',
    spinner: '#ffffff',
  },
  ghost: {
    container: 'border border-neutral-200 bg-transparent active:bg-neutral-100',
    text: 'text-neutral-700',
    spinner: '#404040',
  },
  destructive: {
    container: 'bg-error active:opacity-90',
    text: 'text-white',
    spinner: '#ffffff',
  },
}

const sizeClasses: Record<ButtonSize, { container: string; text: string }> = {
  sm: { container: 'px-3 py-2 rounded-xl', text: 'text-sm font-medium' },
  md: { container: 'px-5 py-3 rounded-2xl', text: 'text-base font-semibold' },
  lg: { container: 'px-6 py-4 rounded-2xl', text: 'text-lg font-semibold' },
}

export function Button({
  onPress,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  children,
  className = '',
}: ButtonProps) {
  const v = variantClasses[variant]
  const s = sizeClasses[size]
  const isDisabled = disabled || isLoading

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      className={`flex-row items-center justify-center ${v.container} ${s.container} ${isDisabled ? 'opacity-50' : ''} ${className}`}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={v.spinner} />
      ) : (
        <Text className={`${v.text} ${s.text}`}>{children}</Text>
      )}
    </TouchableOpacity>
  )
}
