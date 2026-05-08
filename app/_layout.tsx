import { useEffect, useRef } from 'react'
import { Slot, useRouter, useSegments } from 'expo-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { queryClient } from '@lib/queryClient'
import { supabase } from '@lib/supabase'
import { DEV_MODE } from '@/dev/mockData'
import '../global.css'

export default function RootLayout() {
  const router = useRouter()
  const segments = useSegments()
  const segmentsRef = useRef(segments)

  useEffect(() => {
    segmentsRef.current = segments
  }, [segments])

  useEffect(() => {
    if (DEV_MODE) {
      const inAuthGroup = segmentsRef.current[0] === '(auth)'
      if (inAuthGroup || segmentsRef.current.length === 0) {
        router.replace('/(app)')
      }
      return
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const inAuthGroup = segmentsRef.current[0] === '(auth)'
      if (!session && !inAuthGroup) router.replace('/(auth)/login')
      else if (session && inAuthGroup) router.replace('/(app)')
    })
    return () => subscription.unsubscribe()
  }, []) // sin dependencias dinámicas — la suscripción se crea una sola vez

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView className="flex-1">
        <Slot />
      </GestureHandlerRootView>
    </QueryClientProvider>
  )
}
