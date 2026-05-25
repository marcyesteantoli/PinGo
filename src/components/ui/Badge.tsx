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
  primary:   { container: 'bg-primary-100 dark:bg-primary-600/40',     text: 'text-primary-700 dark:text-primary-300'     },
  secondary: { container: 'bg-secondary-100 dark:bg-secondary-600/40', text: 'text-secondary-700 dark:text-secondary-300' },
  active:    { container: 'bg-secondary-500 dark:bg-secondary-600',    text: 'text-white'                                 },
  success:   { container: 'bg-green-100 dark:bg-green-700/40',         text: 'text-green-700 dark:text-green-300'         },
  warning:   { container: 'bg-amber-100 dark:bg-amber-700/40',         text: 'text-amber-700 dark:text-amber-300'         },
  error:     { container: 'bg-red-100 dark:bg-red-700/40',             text: 'text-red-700 dark:text-red-300'             },
  neutral:   { container: 'bg-neutral-200 dark:bg-surface-700',        text: 'text-neutral-700 dark:text-neutral-300'     },
  transport:     { container: 'bg-cyan-100 dark:bg-cyan-700/40',     text: 'text-cyan-500 dark:text-cyan-300'     },
  accommodation: { container: 'bg-purple-100 dark:bg-purple-700/40', text: 'text-purple-500 dark:text-purple-300' },
  activity:      { container: 'bg-lime-100 dark:bg-lime-700/40',     text: 'text-lime-800 dark:text-lime-300'     },
  restaurant:    { container: 'bg-red-100 dark:bg-red-700/40',       text: 'text-red-500 dark:text-red-300'       },
  other:         { container: 'bg-stone-100 dark:bg-stone-700',      text: 'text-stone-600 dark:text-stone-400'   },
}

type CategoryType = 'transport' | 'accommodation' | 'activity' | 'restaurant' | 'other'

const CATEGORY_ICONS: Record<CategoryType, {
  name: React.ComponentProps<typeof Ionicons>['name']
  light: string
  dark: string
}> = {
  transport:     { name: 'airplane-outline',   light: '#06b6d4', dark: '#67e8f9' },
  accommodation: { name: 'bed-outline',        light: '#a855f7', dark: '#d8b4fe' },
  activity:      { name: 'compass-outline',    light: '#3f6212', dark: '#bef264' },
  restaurant:    { name: 'restaurant-outline', light: '#ef4444', dark: '#fca5a5' },
  other:         { name: 'ellipse-outline',    light: '#57534e', dark: '#a8a29e' },
}

const categorySet = new Set<string>(['transport', 'accommodation', 'activity', 'restaurant', 'other'])

export function Badge({ label, variant = 'neutral', className = '' }: BadgeProps) {
  const { colorScheme } = useColorScheme()
  const v = variantClasses[variant]
  const iconDef = categorySet.has(variant) ? CATEGORY_ICONS[variant as CategoryType] : null

  return (
    <View className={`px-2 py-1 rounded-full self-start flex-row items-center gap-1 ${v.container} ${className}`}>
      {iconDef && (
        <Ionicons
          name={iconDef.name}
          size={12}
          color={colorScheme === 'dark' ? iconDef.dark : iconDef.light}
        />
      )}
      <Text className={`text-[12px] font-medium ${v.text}`}>{label}</Text>
    </View>
  )
}
