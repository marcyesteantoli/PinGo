import type { OnboardingSlideData } from './types'

const SLIDES: OnboardingSlideData[] = [
  {
    key: 'intro',
    type: 'intro',
    iconName: 'globe-outline',
    imageSource: require('../../../assets/images/logo_new_transparent.png'),
    accentColor: '#0046de',
    bgColor: '#EFF4FF',
    titleKey: 'onboarding_slide1_title',
    subtitleKey: 'onboarding_slide1_subtitle',
  },
  {
    key: 'problem',
    type: 'problem',
    iconName: 'warning-outline',
    accentColor: '#ef4444',
    bgColor: '#FEF2F2',
    titleKey: 'onboarding_slide2_title',
    subtitleKey: 'onboarding_slide2_subtitle',
  },
  {
    key: 'collaborative',
    type: 'solution',
    iconName: 'people-outline',
    accentColor: '#06b6d4',
    bgColor: '#ECFEFF',
    titleKey: 'onboarding_slide3_title',
    subtitleKey: 'onboarding_slide3_subtitle',
  },
  {
    key: 'gallery',
    type: 'solution',
    iconName: 'images-outline',
    accentColor: '#f97316',
    bgColor: '#FFF7ED',
    titleKey: 'onboarding_slide4_title',
    subtitleKey: 'onboarding_slide4_subtitle',
  },
  {
    key: 'organized',
    type: 'solution',
    iconName: 'briefcase-outline',
    accentColor: '#22c55e',
    bgColor: '#F0FDF4',
    titleKey: 'onboarding_slide5_title',
    subtitleKey: 'onboarding_slide5_subtitle',
  },
  {
    key: 'memories',
    type: 'solution',
    iconName: 'bookmark-outline',
    accentColor: '#ec4899',
    bgColor: '#FDF2F8',
    titleKey: 'onboarding_slide6_title',
    subtitleKey: 'onboarding_slide6_subtitle',
  },
  {
    key: 'pro_awareness',
    type: 'pro_awareness',
    iconName: 'sparkles',
    accentColor: '#0046de',
    bgColor: '#FFFFFF',
    titleKey: 'onboarding_pro_title',
    subtitleKey: 'onboarding_pro_subtitle',
  },
  {
    key: 'activation',
    type: 'activation',
    iconName: 'rocket-outline',
    accentColor: '#7c3aed',
    bgColor: '#F5F3FF',
    titleKey: 'onboarding_slide8_title',
    subtitleKey: 'onboarding_slide8_subtitle',
  },
]

export const INTRO_SLIDES = SLIDES.slice(0, 6)
export const POST_AUTH_SLIDES = SLIDES.slice(6)
export const ALL_SLIDES = SLIDES
