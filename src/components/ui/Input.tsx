import { Text, TextInput, TextInputProps, View } from 'react-native'

interface InputProps extends TextInputProps {
  label?: string
  error?: string
}

export function Input({ label, error, className = '', ...props }: InputProps & { className?: string }) {
  return (
    <View className="gap-1">
      {label && (
        <Text className="text-sm font-medium text-neutral-700">{label}</Text>
      )}
      <TextInput
        className={`border rounded-xl px-4 py-3 text-base text-neutral-900 bg-white ${error ? 'border-error' : 'border-neutral-200'} ${className}`}
        placeholderTextColor="#737373"
        {...props}
      />
      {error && (
        <Text className="text-xs text-error">{error}</Text>
      )}
    </View>
  )
}
