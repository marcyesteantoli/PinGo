import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { setIntroSeen } from '@features/onboarding/hooks/useIntroStatus'
import { OnboardingCarousel } from '@features/onboarding/components/OnboardingCarousel'
import { INTRO_SLIDES } from '@features/onboarding/slides'

export default function IntroScreen() {
  const router = useRouter()

  const goToLogin = async () => {
    await setIntroSeen()
    router.replace('/(auth)/login')
  }

  const handleGetStarted = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    await goToLogin()
  }

  const handleSkip = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    await goToLogin()
  }

  return (
    <OnboardingCarousel
      slides={INTRO_SLIDES}
      onSkip={handleSkip}
      primaryCta={{ labelKey: 'onboarding_get_started', color: '#0046de', onPress: handleGetStarted }}
    />
  )
}
