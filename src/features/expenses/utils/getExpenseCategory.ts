import type { Ionicons } from '@expo/vector-icons'

export type ExpenseCategory = 'restaurant' | 'transport' | 'accommodation' | 'activity' | 'entertainment' | 'city' | 'other'

const CATEGORY_KEYWORDS: [Exclude<ExpenseCategory, 'other'>, RegExp][] = [
  ['restaurant',    /dinner|lunch|breakfast|restaurant|cafeteria|coffee|diner|bistro|brunch|burger|sushi|pizza|tapas|food|snack|\bbar\b|cena|comida|restaurante|desayuno|almuerzo|caf[eé]|gastro/i],
  ['transport',     /\btaxi\b|uber|bolt|lyft|\bbus\b|\bmetro\b|flight|train|ferry|toll|subway|tram|shuttle|parking|fuel|gasoline|vuelo|tren|gasolina|peaje|coche|billete/i],
  ['accommodation', /hotel|airbnb|hostel|motel|lodge|resort|apartment|\bflat\b|\broom\b|check.?in|checkout|alojamiento|habitaci[oó]n|piso|apartamento/i],
  ['entertainment', /cinema|movie|theater|theatre|nightclub|discoteca|disco|karaoke|bowling|festival|\bparty\b|\bshow\b|\bclub\b|cine|pel[ií]cula|teatro|concierto|fiesta|espect[aá]culo/i],
  ['activity',      /museum|tour|excursion|hiking|safari|diving|kayak|sport|ticket|entrance|\bpark\b|visit|entrada|museo|actividad|excursi[oó]n|parque|visita/i],
]

export function getExpenseCategory(description: string, experienceType?: ExpenseCategory | null): ExpenseCategory {
  if (experienceType) return experienceType
  for (const [category, regex] of CATEGORY_KEYWORDS) {
    if (regex.test(description)) return category
  }
  return 'other'
}

export const CATEGORY_ICON: Record<ExpenseCategory, React.ComponentProps<typeof Ionicons>['name']> = {
  restaurant:    'restaurant-outline',
  transport:     'airplane-outline',
  accommodation: 'bed-outline',
  activity:      'compass-outline',
  entertainment: 'film-outline',
  city:          'business-outline',
  other:         'wallet-outline',
}

export const CATEGORY_BG: Record<ExpenseCategory, string> = {
  restaurant:    'bg-activity-orange-bg dark:bg-[#4E1E06]',
  transport:     'bg-activity-blue-bg dark:bg-[#061E4E]',
  accommodation: 'bg-activity-purple-bg dark:bg-[#24064E]',
  activity:      'bg-activity-green-bg dark:bg-[#064E3B]',
  entertainment: 'bg-activity-pink-bg dark:bg-[#4E062A]',
  city:          'bg-activity-teal-bg dark:bg-[#042F2E]',
  other:         'bg-activity-gray-bg dark:bg-[#334155]',
}

export const CATEGORY_ICON_COLORS: Record<ExpenseCategory, { light: string; dark: string }> = {
  restaurant:    { light: '#F97316', dark: '#F97316' },
  transport:     { light: '#3B82F6', dark: '#3B82F6' },
  accommodation: { light: '#8B5CF6', dark: '#8B5CF6' },
  activity:      { light: '#22C55E', dark: '#22C55E' },
  entertainment: { light: '#EC4899', dark: '#EC4899' },
  city:          { light: '#14B8A6', dark: '#14B8A6' },
  other:         { light: '#94A3B8', dark: '#94A3B8' },
}

export const CATEGORY_ORDER: ExpenseCategory[] = [
  'restaurant', 'transport', 'accommodation', 'activity', 'entertainment', 'city', 'other',
]

export const CATEGORY_LABEL_KEY: Record<ExpenseCategory, string> = {
  restaurant:    'expense_category_restaurant',
  transport:     'expense_category_transport',
  accommodation: 'expense_category_accommodation',
  activity:      'expense_category_activity',
  entertainment: 'expense_category_entertainment',
  city:          'expType_city',
  other:         'expense_category_other',
}
