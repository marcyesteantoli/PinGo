import { Ionicons } from '@expo/vector-icons'
import { useColorScheme } from 'nativewind'
import { Text, View } from 'react-native'

export type BadgeVariant =
  | 'primary'
  | 'secondary'
  | 'active'
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
  primary:   { container: 'bg-primary-100',   text: 'text-primary-700'   },
  secondary: { container: 'bg-secondary-100', text: 'text-secondary-700' },
  active:    { container: 'bg-secondary-500', text: 'text-white'          },
  success:   { container: 'bg-green-100',     text: 'text-green-700'     },
  warning:   { container: 'bg-amber-100',     text: 'text-amber-700'     },
  error:     { container: 'bg-red-100',       text: 'text-red-700'       },
  neutral:   { container: 'bg-neutral-100',   text: 'text-neutral-700'   },
  transport:     { container: 'bg-cyan-100 dark:bg-cyan-900/40',     text: 'text-cyan-800 dark:text-cyan-300'     },
  accommodation: { container: 'bg-purple-100 dark:bg-purple-900/40', text: 'text-purple-800 dark:text-purple-300' },
  activity:      { container: 'bg-lime-100 dark:bg-lime-900/40',     text: 'text-lime-800 dark:text-lime-300'     },
  restaurant:    { container: 'bg-red-100 dark:bg-red-900/40',       text: 'text-red-800 dark:text-red-300'       },
  other:         { container: 'bg-stone-100 dark:bg-stone-800',      text: 'text-stone-600 dark:text-stone-400'   },
}

type CategoryType = 'transport' | 'accommodation' | 'activity' | 'restaurant' | 'other'

const CATEGORY_ICONS: Record<CategoryType, {
  name: React.ComponentProps<typeof Ionicons>['name']
  light: string
  dark: string
}> = {
  transport:     { name: 'airplane-outline',   light: '#155e75', dark: '#67e8f9' },
  accommodation: { name: 'bed-outline',        light: '#6b21a8', dark: '#d8b4fe' },
  activity:      { name: 'compass-outline',    light: '#3f6212', dark: '#bef264' },
  restaurant:    { name: 'restaurant-outline', light: '#991b1b', dark: '#fca5a5' },
  other:         { name: 'ellipse-outline',    light: '#57534e', dark: '#a8a29e' },
}

const categorySet = new Set<string>(['transport', 'accommodation', 'activity', 'restaurant', 'other'])

export function Badge({ label, variant = 'neutral', className = '' }: BadgeProps) {
  const { colorScheme } = useColorScheme()
  const v = variantClasses[variant]
  const iconDef = categorySet.has(variant) ? CATEGORY_ICONS[variant as CategoryType] : null

  return (
    <View className={`px-2.5 py-1.5 rounded-full self-start flex-row items-center gap-1 ${v.container} ${className}`}>
      {iconDef && (
        <Ionicons
          name={iconDef.name}
          size={14}
          color={colorScheme === 'dark' ? iconDef.dark : iconDef.light}
        />
      )}
      <Text className={`text-sm font-medium ${v.text}`}>{label}</Text>
    </View>
  )
}
