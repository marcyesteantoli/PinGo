export const PLANS = {
  pro_monthly: { priceDisplay: '€4.99/mes',  sku: 'tripsync_pro_monthly' },
  pro_annual:  { priceDisplay: '€34.99/año', sku: 'tripsync_pro_annual'  },
  trip_unlock: { priceDisplay: '€2.49',      sku: 'tripsync_trip_unlock' },
} as const

export const PREMIUM_FEATURES = ['export_pdf', 'collaborators_4plus', 'multi_currency'] as const
export type PremiumFeature = typeof PREMIUM_FEATURES[number]
