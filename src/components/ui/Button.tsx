import { ReactNode } from 'react'
import { ActivityIndicator, Text, TouchableOpacity } from 'react-native'
import { colors } from '@lib/colors'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps {
  onPress?: () => void
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  disabled?: boolean
  children: ReactNode
  className?: string
}

const variantClasses: Record<ButtonVariant, { container: string; text: string; spinner: string }> = {
  primary: {
    container: 'bg-primary-500 active:bg-primary-600',
    text: 'text-white',
    spinner: colors.white,
  },
  secondary: {
    container: 'bg-secondary-500 active:bg-secondary-600',
    text: 'text-white',
    spinner: colors.white,
  },
  ghost: {
    container: 'border border-neutral-300 bg-transparent active:bg-neutral-100 dark:border-neutral-600 dark:active:bg-neutral-800',
    text: 'text-neutral-700 dark:text-neutral-200',
    spinner: colors.neutral[600],
  },
  destructive: {
    container: 'bg-error active:opacity-90',
    text: 'text-white',
    spinner: colors.white,
  },
}

const sizeClasses: Record<ButtonSize, { container: string; text: string }> = {
  sm: { container: 'px-4 py-2 rounded-full', text: 'text-[15px] font-medium' },
  md: { container: 'px-5 py-[11px] rounded-[10px]', text: 'text-[17px] font-semibold' },
  lg: { container: 'px-6 py-[13px] rounded-[14px]', text: 'text-[17px] font-semibold' },
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
      activeOpacity={0.7}
      className={`flex-row items-center justify-center ${v.container} ${s.container} ${isDisabled ? 'opacity-50' : ''} ${className}`}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={v.spinner} />
      ) : typeof children === 'string' ? (
        <Text className={`${v.text} ${s.text}`}>{children}</Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  )
}
