import { Stack } from 'expo-router'

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ presentation: 'modal' }} />
      <Stack.Screen name="trips/new" options={{ presentation: 'modal' }} />
      <Stack.Screen name="trips/[id]" />
      <Stack.Screen name="trips/experience/[experienceId]" options={{ headerShown: false }} />
      <Stack.Screen name="saved-experiences/[experienceId]" options={{ headerShown: false }} />
    </Stack>
  )
}
