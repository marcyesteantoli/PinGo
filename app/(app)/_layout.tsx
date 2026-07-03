import { Redirect, Stack } from 'expo-router'
import { useSession } from '@lib/session'

export default function AppLayout() {
  const { session, isLoading } = useSession()

  if (isLoading) return null
  if (!session) return <Redirect href="/(auth)/login" />

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ presentation: 'modal' }} />
      <Stack.Screen name="trips/new" options={{ presentation: 'modal' }} />
      <Stack.Screen name="trips/[id]" />
      <Stack.Screen name="trips/experience/[experienceId]" options={{ headerShown: false }} />
      <Stack.Screen name="trips/expense/[expenseId]" options={{ headerShown: false }} />
      <Stack.Screen name="saved-experiences/[experienceId]" options={{ headerShown: false }} />
      <Stack.Screen name="saved-experiences/map" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
    </Stack>
  )
}
