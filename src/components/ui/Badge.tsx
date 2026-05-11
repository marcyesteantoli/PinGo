import { Text, View } from 'react-native'

export type BadgeVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error'
  | 'neutral'
  | 'transport'
  | 'accommodation'
  | 'activity'
  | 'restaurant'
  | 'other'

interface BadgeProps {
  label: string
  variant?: BadgeVariant
  className?: string
}

const variantClasses: Record<BadgeVariant, { container: string; text: string }> = {
  primary: { container: 'bg-primary-100', text: 'text-primary-700' },
  secondary: { container: 'bg-sky-100', text: 'text-sky-700' },
  success: { container: 'bg-green-100', text: 'text-green-700' },
  warning: { container: 'bg-amber-100', text: 'text-amber-700' },
  error: { container: 'bg-red-100', text: 'text-red-700' },
  neutral: { container: 'bg-neutral-100', text: 'text-neutral-700' },
  transport: { container: 'bg-sky-100', text: 'text-sky-700' },
  accommodation: { container: 'bg-secondary-100', text: 'text-secondary-700' },
  activity: { container: 'bg-orange-100', text: 'text-orange-700' },
  restaurant: { container: 'bg-amber-100', text: 'text-amber-700' },
  other: { container: 'bg-neutral-100', text: 'text-neutral-500' },
}

export function Badge({ label, variant = 'neutral', className = '' }: BadgeProps) {
  const v = variantClasses[variant]

  return (
    <View className={`px-2.5 py-1 rounded-full self-start ${v.container} ${className}`}>
      <Text className={`text-xs font-medium ${v.text}`}>{label}</Text>
    </View>
  )
}
