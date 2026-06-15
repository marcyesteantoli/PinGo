import { useEffect, useRef, useState } from 'react'
import { View } from 'react-native'
import { Slot, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { QueryClientProvider } from '@tanstack/react-query'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { KeyboardProvider } from 'react-native-keyboard-controller'
import { useFonts, PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold } from '@expo-google-fonts/plus-jakarta-sans'
import { ShareIntentProvider, useShareIntentContext } from 'expo-share-intent'
import { queryClient } from '@lib/queryClient'
import { supabase } from '@lib/supabase'
import { ThemeProvider, useTheme } from '@lib/theme'
import { LanguageProvider } from '@lib/language'
import { ErrorToastProvider, ErrorToastPortal } from '@lib/errorToast'
import { getLastActiveTripId } from '@lib/lastActiveTrip'
import { getOnboardingCompleted } from '@features/onboarding/hooks/useOnboardingStatus'
import { ShareDocumentSheet } from '@features/documents/components/ShareDocumentSheet'
import { initI18n } from '@/i18n'
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const inAuthGroup = segmentsRef.current[0] === '(auth)'
      const isPublicRoute = inAuthGroup || segmentsRef.current[0] === 'intro'
      if (!session && !isPublicRoute) router.replace('/(auth)/login')
      else if (session && inAuthGroup) {
        queryClient.clear()
        ;(async () => {
          const completed = await getOnboardingCompleted(session.user.id)
          router.replace(completed ? '/(app)/(tabs)/trips' : '/(app)/onboarding')
        })()
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
      <View className="flex-1">
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Slot />
        <ShareIntentHandler />
        <ErrorToastPortal />
      </View>
      </KeyboardProvider>
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
  const [i18nReady, setI18nReady] = useState(false)

  useEffect(() => {
    initI18n().then(() => setI18nReady(true))
  }, [])

  if (!fontsLoaded || !i18nReady) return null

  return (
    <ShareIntentProvider options={{ scheme: 'pingo' }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <LanguageProvider>
            <ErrorToastProvider>
              <AppShell />
            </ErrorToastProvider>
          </LanguageProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ShareIntentProvider>
  )
}
