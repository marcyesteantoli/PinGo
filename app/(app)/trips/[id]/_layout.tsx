import { Tabs, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { TripProvider } from '@features/trips/TripProvider'
import { useTheme } from '@lib/theme'

export default function TripLayout() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { isDark } = useTheme()

  return (
    <TripProvider tripId={id}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#06b6d4',
          tabBarInactiveTintColor: isDark ? '#94a3b8' : '#64748b',
          tabBarStyle: {
            backgroundColor: isDark ? '#142033' : '#ffffff',
            borderTopColor: isDark ? '#1e2c42' : '#e2e8f5',
            borderTopWidth: 1,
          },
        }}
      >
        <Tabs.Screen
          name="timeline"
          options={{
            title: 'Timeline',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="calendar-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="documents"
          options={{
            title: 'Documentos',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="document-text-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="expenses"
          options={{
            title: 'Gastos',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="wallet-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="memories"
          options={{
            title: 'Recuerdos',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="images-outline" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </TripProvider>
  )
}
