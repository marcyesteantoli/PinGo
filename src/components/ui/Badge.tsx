import { Ionicons } from '@expo/vector-icons'
import { useColorScheme } from 'nativewind'
import { Text, View } from 'react-native'

export type BadgeVariant =
  | 'primary'
  | 'active'
  | 'success'
  | 'warning'
  | 'error'
  | 'neutral'
  | 'transport'
  | 'accommodation'
  | 'activity'
  | 'restaurant'
  | 'city'
  | 'entertainment'
  | 'other'

interface BadgeProps {
  label: string
  variant?: BadgeVariant
  className?: string
}

const variantClasses: Record<BadgeVariant, { container: string; text: string }> = {
  primary:       { container: 'bg-primary-100 dark:bg-primary-600/40',              text: 'text-primary-700 dark:text-primary-300'     },
  active:        { container: 'bg-primary-500 dark:bg-primary-600',                 text: 'text-white'                                 },
  success:       { container: 'bg-green-100 dark:bg-green-700/40',                  text: 'text-green-700 dark:text-green-300'         },
  warning:       { container: 'bg-amber-100 dark:bg-amber-700/40',                  text: 'text-amber-700 dark:text-amber-300'         },
  error:         { container: 'bg-red-100 dark:bg-red-700/40',                      text: 'text-red-700 dark:text-red-300'             },
  neutral:       { container: 'bg-neutral-200 dark:bg-surface-700',                 text: 'text-neutral-700 dark:text-neutral-300'     },
  transport:     { container: 'bg-activity-blue-bg dark:bg-activity-blue-darkBg',       text: 'text-activity-blue-main'   },
  accommodation: { container: 'bg-activity-purple-bg dark:bg-activity-purple-darkBg',   text: 'text-activity-purple-main' },
  activity:      { container: 'bg-activity-green-bg dark:bg-activity-green-darkBg',     text: 'text-activity-green-main'  },
  restaurant:    { container: 'bg-activity-orange-bg dark:bg-activity-orange-darkBg',   text: 'text-activity-orange-main' },
  city:          { container: 'bg-[#E0F2FE] dark:bg-[#06304E]',                         text: 'text-[#0EA5E9]'            },
  entertainment: { container: 'bg-activity-pink-bg dark:bg-activity-pink-darkBg',       text: 'text-activity-pink-main'   },
  other:         { container: 'bg-activity-gray-bg dark:bg-activity-gray-darkBg',       text: 'text-activity-gray-main'   },
}

type CategoryType = 'transport' | 'accommodation' | 'activity' | 'restaurant' | 'city' | 'entertainment' | 'other'

const CATEGORY_ICONS: Record<CategoryType, {
  name: React.ComponentProps<typeof Ionicons>['name']
  light: string
  dark: string
}> = {
  transport:     { name: 'airplane-outline',   light: '#3B82F6', dark: '#3B82F6' },
  accommodation: { name: 'bed-outline',        light: '#8B5CF6', dark: '#8B5CF6' },
  activity:      { name: 'compass-outline',    light: '#22C55E', dark: '#22C55E' },
  restaurant:    { name: 'restaurant-outline', light: '#F97316', dark: '#F97316' },
  city:          { name: 'business-outline',   light: '#0EA5E9', dark: '#0EA5E9' },
  entertainment: { name: 'film-outline',       light: '#EC4899', dark: '#EC4899' },
  other:         { name: 'ellipse-outline',    light: '#94A3B8', dark: '#94A3B8' },
}

const categorySet = new Set<string>(['transport', 'accommodation', 'activity', 'restaurant', 'city', 'entertainment', 'other'])

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
