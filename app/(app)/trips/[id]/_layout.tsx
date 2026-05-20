import { Tabs, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { TripProvider } from '@features/trips/TripProvider'
import { useTheme } from '@lib/theme'
import { colors } from '@lib/colors'

export default function TripLayout() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { isDark } = useTheme()

  return (
    <TripProvider tripId={id}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary[500],
          tabBarInactiveTintColor: isDark ? colors.neutral[500] : colors.neutral[400],
          tabBarStyle: {
            backgroundColor: isDark ? 'rgba(20,32,51,0.97)' : 'rgba(255,255,255,0.97)',
            borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)',
            borderTopWidth: 0.5,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '500',
          },
        }}
      >
        <Tabs.Screen
          name="timeline"
          options={{
            title: 'Timeline',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="memories"
          options={{
            title: 'Recuerdos',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? 'images' : 'images-outline'} size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="expenses"
          options={{
            title: 'Gastos',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? 'wallet' : 'wallet-outline'} size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="documents"
          options={{
            title: 'Documentos',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? 'document-text' : 'document-text-outline'} size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </TripProvider>
  )
}
