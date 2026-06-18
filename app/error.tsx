import { useEffect } from 'react'
import { View, Text, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import type { ErrorBoundaryProps } from 'expo-router'
import { Sentry } from '@lib/sentry'

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const router = useRouter()

  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}>
      <Text style={{ fontSize: 17, fontWeight: '600', textAlign: 'center' }}>
        Esta pantalla no pudo cargar
      </Text>
      <Text style={{ fontSize: 15, color: '#666', textAlign: 'center' }}>
        El problema ha sido reportado automáticamente.
      </Text>
      <Pressable
        onPress={retry}
        style={{ paddingVertical: 12, paddingHorizontal: 24, backgroundColor: '#0046de', borderRadius: 12 }}
      >
        <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>Reintentar</Text>
      </Pressable>
      <Pressable onPress={() => router.replace('/(app)/(tabs)/trips')}>
        <Text style={{ color: '#0046de', fontSize: 15 }}>Ir al inicio</Text>
      </Pressable>
    </View>
  )
}
