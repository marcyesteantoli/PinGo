import { useEffect, useState } from 'react'
import { Redirect } from 'expo-router'
import { supabase } from '@lib/supabase'
import { getIntroSeen } from '@features/onboarding/hooks/useIntroStatus'
import { getOnboardingCompleted } from '@features/onboarding/hooks/useOnboardingStatus'

export default function Index() {
  const [target, setTarget] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        const completed = await getOnboardingCompleted(session.user.id)
        setTarget(completed ? '/(app)/(tabs)/trips' : '/(app)/onboarding')
        return
      }

      const introSeen = await getIntroSeen()
      setTarget(introSeen ? '/(auth)/login' : '/intro')
    })()
  }, [])

  if (!target) return null

  return <Redirect href={target} />
}
