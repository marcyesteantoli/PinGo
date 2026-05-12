import { useEffect, useRef } from 'react'
import { View } from 'react-native'
import { Slot, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { QueryClientProvider } from '@tanstack/react-query'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { useFonts, PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold } from '@expo-google-fonts/plus-jakarta-sans'
import { queryClient } from '@lib/queryClient'
import { supabase } from '@lib/supabase'
import { ThemeProvider, useTheme } from '@lib/theme'
import { DEV_MODE } from '@/dev/mockData'
import '../global.css'

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const inAuthGroup = segmentsRef.current[0] === '(auth)'
      if (!session && !inAuthGroup) router.replace('/(auth)/login')
      else if (session && inAuthGroup) router.replace('/(app)')
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View className={`flex-1${isDark ? ' dark' : ''}`}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Slot />
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
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AppShell />
      </ThemeProvider>
    </QueryClientProvider>
  )
}
