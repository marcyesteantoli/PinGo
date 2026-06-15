import { Platform, StyleSheet } from 'react-native'
import { colors } from '@lib/colors'

export const cardShadow = Platform.select({
  android: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.10)',
  },
  default: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
}) as object

export const ctaShadow = {
  shadowColor: colors.primary[500],
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.35,
  shadowRadius: 14,
  elevation: 8,
  borderRadius: 16,
} as const

export const fabShadow = {
  shadowColor: colors.primary[500],
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 12,
  elevation: 8,
} as const
