import { Ionicons } from '@expo/vector-icons'
import { forwardRef, useState } from 'react'
import { Text, TextInput, TextInputProps, View } from 'react-native'
import { colors } from '@lib/colors'

interface InputProps extends TextInputProps {
  label?: string
  error?: string
  leftIcon?: React.ComponentProps<typeof Ionicons>['name']
}

export const Input = forwardRef<TextInput, InputProps & { className?: string }>(
  function Input({ label, error, leftIcon, className = '', ...props }, ref) {
    const [focused, setFocused] = useState(false)

    const containerClass = error
      ? 'bg-red-50 dark:bg-red-900/20 border border-error'
      : focused
        ? 'bg-neutral-100 dark:bg-surface-700 border border-primary-500/30 dark:border-primary-400/30'
        : 'bg-neutral-100 dark:bg-surface-700 border border-transparent'

    return (
      <View className="gap-1">
        {label && (
          <Text className="text-[13px] font-medium text-neutral-600 dark:text-neutral-400">{label}</Text>
        )}
        <View className={`flex-row items-center rounded-[10px] ${containerClass}`}>
          {leftIcon && (
            <View className="pl-3">
              <Ionicons name={leftIcon} size={18} color={colors.neutral[400]} />
            </View>
          )}
          <TextInput
            ref={ref}
            className={`flex-1 ${leftIcon ? 'pl-2 pr-4' : 'px-4'} py-[11px] text-[17px] text-neutral-900 dark:text-neutral-50 ${className}`}
            placeholderTextColor={colors.neutral[400]}
            onFocus={(e) => { setFocused(true); props.onFocus?.(e) }}
            onBlur={(e) => { setFocused(false); props.onBlur?.(e) }}
            {...props}
          />
        </View>
        {error && (
          <Text className="text-[13px] text-error">{error}</Text>
        )}
      </View>
    )
  }
)
