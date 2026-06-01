import { Ionicons } from '@expo/vector-icons'
import type { WishlistItemType } from '@types/index'

export const TYPE_ICONS: Record<WishlistItemType, keyof typeof Ionicons.glyphMap> = {
  city:          'business-outline',
  restaurant:    'restaurant-outline',
  activity:      'bicycle-outline',
  accommodation: 'bed-outline',
  entertainment: 'film-outline',
  other:         'ellipsis-horizontal-outline',
}

export const TYPE_COLORS: Record<WishlistItemType, string> = {
  city:          '#0EA5E9',
  restaurant:    '#F97316',
  activity:      '#22C55E',
  accommodation: '#8B5CF6',
  entertainment: '#EC4899',
  other:         '#94A3B8',
}

export const TYPE_BG_COLORS: Record<WishlistItemType, { light: string; dark: string }> = {
  city:          { light: '#E0F2FE', dark: '#06304E' },
  restaurant:    { light: '#FFEDD5', dark: '#4E1E06' },
  activity:      { light: '#DCFCE7', dark: '#064E3B' },
  accommodation: { light: '#EDE9FE', dark: '#24064E' },
  entertainment: { light: '#FCE7F3', dark: '#4E062A' },
  other:         { light: '#F1F5F9', dark: '#334155' },
}

export const WISHLIST_TYPES: {
  key: WishlistItemType
  label: string
  icon: keyof typeof Ionicons.glyphMap
}[] = [
  { key: 'city',          label: 'Ciudad',          icon: 'business-outline' },
  { key: 'restaurant',    label: 'Restaurante',     icon: 'restaurant-outline' },
  { key: 'activity',      label: 'Actividad',       icon: 'bicycle-outline' },
  { key: 'accommodation', label: 'Alojamiento',     icon: 'bed-outline' },
  { key: 'entertainment', label: 'Entretenimiento', icon: 'film-outline' },
  { key: 'other',         label: 'Otro',            icon: 'ellipsis-horizontal-outline' },
]
