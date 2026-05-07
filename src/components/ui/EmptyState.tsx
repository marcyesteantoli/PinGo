import { Ionicons } from '@expo/vector-icons'
import { Text, View } from 'react-native'
import { Button } from './Button'

interface EmptyStateProps {
  icon: React.ComponentProps<typeof Ionicons>['name']
  title: string
  subtitle?: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ icon, title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center p-8 gap-4">
      <Ionicons name={icon} size={64} color="#c5ced8" />
      <Text className="text-xl font-semibold text-neutral-700 text-center">{title}</Text>
      {subtitle && (
        <Text className="text-sm text-neutral-500 text-center">{subtitle}</Text>
      )}
      {actionLabel && onAction && (
        <Button onPress={onAction} variant="primary" size="md">
          {actionLabel}
        </Button>
      )}
    </View>
  )
}
