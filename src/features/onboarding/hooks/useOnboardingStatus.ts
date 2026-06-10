import AsyncStorage from '@react-native-async-storage/async-storage'
import { useEffect, useState } from 'react'

const key = (userId: string) => `@tripsync/onboarding_${userId}`

export async function getOnboardingCompleted(userId: string): Promise<boolean> {
  const value = await AsyncStorage.getItem(key(userId))
  return value === 'true'
}

export async function setOnboardingCompleted(userId: string): Promise<void> {
  await AsyncStorage.setItem(key(userId), 'true')
}

export function useOnboardingStatus(userId: string | undefined) {
  const [isLoading, setIsLoading] = useState(true)
  const [isCompleted, setIsCompleted] = useState<boolean | null>(null)

  useEffect(() => {
    if (!userId) return
    getOnboardingCompleted(userId)
      .then((completed) => setIsCompleted(completed))
      .finally(() => setIsLoading(false))
  }, [userId])

  const markCompleted = async () => {
    if (!userId) return
    await setOnboardingCompleted(userId)
    setIsCompleted(true)
  }

  return { isLoading, isCompleted, markCompleted }
}
