import { Tabs, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { TripProvider } from '@features/trips/TripProvider'
import { useTheme } from '@lib/theme'
import { colors } from '@lib/colors'

export default function TripLayout() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { isDark } = useTheme()
  const { t } = useTranslation()

  return (
    <TripProvider tripId={id}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary[500],
          tabBarInactiveTintColor: isDark ? colors.neutral[500] : colors.neutral[400],
          tabBarStyle: {
            backgroundColor: isDark ? 'rgba(23,45,72, 1)' : 'rgba(255,255,255,1)',
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
            title: t('tripTab_timeline'),
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="memories"
          options={{
            title: t('tripTab_memories'),
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? 'images' : 'images-outline'} size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="expenses"
          options={{
            title: t('tripTab_expenses'),
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? 'wallet' : 'wallet-outline'} size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="documents"
          options={{
            title: t('tripTab_documents'),
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? 'document-text' : 'document-text-outline'} size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </TripProvider>
  )
}
