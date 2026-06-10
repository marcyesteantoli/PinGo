import type { ComponentProps } from 'react'
import type { Ionicons } from '@expo/vector-icons'

export type SlideType = 'intro' | 'problem' | 'solution' | 'activation'

export interface OnboardingSlideData {
  key: string
  type: SlideType
  iconName: ComponentProps<typeof Ionicons>['name']
  imageSource?: number
  accentColor: string
  bgColor: string
  titleKey: string
  subtitleKey: string
}
