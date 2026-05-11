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
          <Text className="text-[13px] font-medium text-neutral-500 dark:text-neutral-400">{label}</Text>
        )}
        <TextInput
          ref={ref}
          className={`rounded-[10px] px-4 py-[11px] text-[17px] text-neutral-900 dark:text-neutral-50 ${error ? 'bg-red-50 dark:bg-red-900/20' : 'bg-neutral-100 dark:bg-surface-700'} ${className}`}
          placeholderTextColor="#94a3b8"
          {...props}
        />
        {error && (
          <Text className="text-[13px] text-error">{error}</Text>
        )}
      </View>
    )
  }
)
