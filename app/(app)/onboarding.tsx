import { useRouter, useLocalSearchParams } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { useCurrentUser } from '@features/auth/hooks/useCurrentUser'
import { useOnboardingStatus } from '@features/onboarding/hooks/useOnboardingStatus'
import { OnboardingCarousel } from '@features/onboarding/components/OnboardingCarousel'
import { ALL_SLIDES } from '@features/onboarding/slides'

export default function OnboardingScreen() {
  const router = useRouter()
  const { replay } = useLocalSearchParams<{ replay?: string }>()
  const isReplay = replay === '1'
  const { data: user } = useCurrentUser()
  const { markCompleted } = useOnboardingStatus(user?.id)

  const handleCreateTrip = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    await markCompleted()
    router.replace('/(app)/(tabs)/trips')
    setTimeout(() => router.push('/(app)/trips/new'), 100)
  }

  const handleSkip = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    if (isReplay) {
      router.back()
      return
    }
    await markCompleted()
    router.replace('/(app)/(tabs)/trips')
  }

  return (
    <OnboardingCarousel
      slides={ALL_SLIDES}
      onSkip={handleSkip}
      primaryCta={{ labelKey: 'onboarding_create_trip', color: '#7c3aed', onPress: handleCreateTrip }}
      secondaryCta={{ labelKey: 'onboarding_explore_first', onPress: handleSkip }}
    />
  )
}
