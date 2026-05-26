import { useEffect, useRef, useState } from 'react'
import { View } from 'react-native'
import { Slot, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { QueryClientProvider } from '@tanstack/react-query'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { useFonts, PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold } from '@expo-google-fonts/plus-jakarta-sans'
import { ShareIntentProvider, useShareIntentContext } from 'expo-share-intent'
import { queryClient } from '@lib/queryClient'
import { supabase } from '@lib/supabase'
import { ThemeProvider, useTheme } from '@lib/theme'
import { getLastActiveTripId } from '@lib/lastActiveTrip'
import { ShareDocumentSheet } from '@features/documents/components/ShareDocumentSheet'
import { DEV_MODE } from '@/dev/mockData'
import '../global.css'

function ShareIntentHandler() {
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntentContext()
  const [lastTripId, setLastTripId] = useState<string | undefined>()

  useEffect(() => {
    if (hasShareIntent) {
      getLastActiveTripId().then(id => setLastTripId(id ?? undefined))
    }
  }, [hasShareIntent])

  const file = shareIntent?.files?.[0]
  if (!hasShareIntent || !file) return null

  return (
    <ShareDocumentSheet
      visible
      onClose={resetShareIntent}
      fileUri={file.path}
      mimeType={file.mimeType}
      fileName={file.fileName}
      initialTripId={lastTripId}
    />
  )
}

function AppShell() {
  const { isDark } = useTheme()
  const router = useRouter()
  const segments = useSegments()
  const segmentsRef = useRef(segments)

  useEffect(() => {
    segmentsRef.current = segments
  }, [segments])

  useEffect(() => {
    if (DEV_MODE) {
      const inAuthGroup = segmentsRef.current[0] === '(auth)'
      if (inAuthGroup) {
        router.replace('/(app)')
      }
      return
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const inAuthGroup = segmentsRef.current[0] === '(auth)'
      if (!session && !inAuthGroup) router.replace('/(auth)/login')
      else if (session && inAuthGroup) {
        queryClient.clear()
        router.replace('/(app)')
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View className="flex-1">
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Slot />
        <ShareIntentHandler />
      </View>
    </GestureHandlerRootView>
  )
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  })

  if (!fontsLoaded) return null

  return (
    <ShareIntentProvider options={{ scheme: 'pingo' }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AppShell />
        </ThemeProvider>
      </QueryClientProvider>
    </ShareIntentProvider>
  )
}
