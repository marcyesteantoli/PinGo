import { useEffect, useRef, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { Slot, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { QueryClientProvider } from '@tanstack/react-query'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { KeyboardProvider } from 'react-native-keyboard-controller'
import Animated, { FadeOut } from 'react-native-reanimated'
import { useFonts, PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold } from '@expo-google-fonts/plus-jakarta-sans'
import { ShareIntentProvider, useShareIntentContext } from 'expo-share-intent'
import { queryClient } from '@lib/queryClient'
import { queryKeys } from '@lib/queryKeys'
import { supabase } from '@lib/supabase'
import { ThemeProvider, useTheme } from '@lib/theme'
import { LanguageProvider } from '@lib/language'
import { ErrorToastProvider, ErrorToastPortal } from '@lib/errorToast'
import { getLastActiveTripId } from '@lib/lastActiveTrip'
import { getOnboardingCompleted } from '@features/onboarding/hooks/useOnboardingStatus'
import { WelcomeScreen } from '@features/auth/components/WelcomeScreen'
import { initRatingSession } from '@/hooks/useRatingPrompt'
import { ShareDocumentSheet } from '@features/documents/components/ShareDocumentSheet'
import { useNotificationSetup } from '@features/notifications/useNotificationSetup'
import { useNotificationHandler } from '@features/notifications/useNotificationHandler'
import { useRevenueCatSetup } from '@features/premium/hooks/useRevenueCatSetup'
import { initI18n } from '@/i18n'
import { initSentry, Sentry } from '@lib/sentry'
import { SentryErrorBoundary } from '@components/SentryErrorBoundary'
import '../global.css'

initSentry()

async function fetchTrips() {
  const { data, error } = await supabase
    .from('trips')
    .select('*, trip_collaborators(user_id, role, status, joined_at, profiles(name, avatar_url))')
    .order('start_date', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []).map(({ trip_collaborators, ...trip }: any) => ({
    ...trip,
    collaborators: (trip_collaborators ?? [])
      .filter((c: any) => c.status === 'active')
      .map((c: any) => ({
        user_id: c.user_id,
        role: c.role,
        status: c.status,
        joined_at: c.joined_at,
        name: c.profiles?.name ?? '',
        avatar_url: c.profiles?.avatar_url ?? null,
      })),
  }))
}

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

function AppShell({ onAppReady }: { onAppReady: () => void }) {
  const { isDark } = useTheme()
  const router = useRouter()
  const segments = useSegments()
  const segmentsRef = useRef(segments)
  const readyCalledRef = useRef(false)

  const callOnAppReady = () => {
    if (!readyCalledRef.current) {
      readyCalledRef.current = true
      onAppReady()
    }
  }

  useEffect(() => {
    initRatingSession()
  }, [])

  useNotificationSetup()
  useNotificationHandler()
  useRevenueCatSetup()

  useEffect(() => {
    segmentsRef.current = segments
  }, [segments])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      Sentry.setUser(session?.user ? { id: session.user.id } : null)
      const inAuthGroup = segmentsRef.current[0] === '(auth)'
      const isPublicRoute = inAuthGroup || segmentsRef.current[0] === 'intro' || segmentsRef.current.length === 0

      if (!session && !isPublicRoute) {
        callOnAppReady()
        router.replace('/(auth)/login')
      } else if (session && inAuthGroup) {
        queryClient.clear()
        ;(async () => {
          const [completed] = await Promise.all([
            getOnboardingCompleted(session.user.id),
            queryClient.prefetchQuery({ queryKey: queryKeys.trips.list(), queryFn: fetchTrips }),
          ])
          router.replace(completed ? '/(app)/(tabs)/trips' : '/(app)/onboarding')
          callOnAppReady()
        })()
      } else if (session) {
        queryClient.prefetchQuery({ queryKey: queryKeys.trips.list(), queryFn: fetchTrips })
          .then(() => callOnAppReady())
      } else {
        callOnAppReady()
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <KeyboardProvider>
      <View className="flex-1">
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Slot />
        <ShareIntentHandler />
        <ErrorToastPortal />
      </View>
    </KeyboardProvider>
  )
}

function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  })
  const [i18nReady, setI18nReady] = useState(false)
  const [appReady, setAppReady] = useState(false)

  useEffect(() => {
    initI18n().then(() => setI18nReady(true))
  }, [])

  const providersReady = fontsLoaded && i18nReady

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {providersReady && (
        <SentryErrorBoundary>
          <ShareIntentProvider options={{ scheme: 'pingo' }}>
            <QueryClientProvider client={queryClient}>
              <ThemeProvider>
                <LanguageProvider>
                  <ErrorToastProvider>
                    <AppShell onAppReady={() => setAppReady(true)} />
                  </ErrorToastProvider>
                </LanguageProvider>
              </ThemeProvider>
            </QueryClientProvider>
          </ShareIntentProvider>
        </SentryErrorBoundary>
      )}
      {(!providersReady || !appReady) && (
        <Animated.View exiting={FadeOut.duration(300)} style={StyleSheet.absoluteFill}>
          <WelcomeScreen />
        </Animated.View>
      )}
    </GestureHandlerRootView>
  )
}

export default Sentry.wrap(RootLayout)
