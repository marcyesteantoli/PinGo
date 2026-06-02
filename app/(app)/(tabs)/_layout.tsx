import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useColorScheme } from 'nativewind'
import { useTranslation } from 'react-i18next'

export default function TabsLayout() {
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'
  const { t } = useTranslation()

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0046de',
        tabBarInactiveTintColor: isDark ? '#64748b' : '#94a3b8',
        tabBarStyle: {
          backgroundColor: isDark ? '#172d48' : '#ffffff',
          borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
          borderTopWidth: 0.5,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="trips"
        options={{
          title: t('tabs_trips'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'airplane' : 'airplane-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="saved-experiences"
        options={{
          title: t('tabs_saved'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'bookmark' : 'bookmark-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          title: t('tabs_wishlist'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'heart' : 'heart-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  )
}
