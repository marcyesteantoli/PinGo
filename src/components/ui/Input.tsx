import { forwardRef } from 'react'
import { Text, TextInput, TextInputProps, View } from 'react-native'

interface InputProps extends TextInputProps {
  label?: string
  error?: string
}

export const Input = forwardRef<TextInput, InputProps & { className?: string }>(
  function Input({ label, error, className = '', ...props }, ref) {
    return (
      <View className="gap-1">
        {label && (
          <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{label}</Text>
        )}
        <TextInput
          ref={ref}
          className={`border rounded-xl px-4 py-3 text-base text-neutral-900 bg-white dark:bg-surface-800 dark:border-surface-600 dark:text-neutral-50 ${error ? 'border-error' : 'border-neutral-200'} ${className}`}
          placeholderTextColor="#8d99ae"
          {...props}
        />
        {error && (
          <Text className="text-xs text-error">{error}</Text>
        )}
      </View>
    )
  }
)
