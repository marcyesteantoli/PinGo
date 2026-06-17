import { useEffect } from 'react'
import { AppState } from 'react-native'
import * as Notifications from 'expo-notifications'
import { useRouter } from 'expo-router'
import { resolveDeeplink } from './deeplinks'

export function useNotificationHandler() {
  const router = useRouter()

  useEffect(() => {
    // Tap on notification while app is open or in background
    const tapSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as {
        event?: string
        trip_id?: string
      }
      const path = resolveDeeplink(data)
      router.push(path as any)
    })

    // Cold start: app opened by tapping a notification
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (!response) return
        const data = response.notification.request.content.data as {
          event?: string
          trip_id?: string
        }
        const path = resolveDeeplink(data)
        router.push(path as any)
      })
      .catch(() => {})

    // Clear badge count whenever app comes to foreground
    const stateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        Notifications.setBadgeCountAsync(0).catch(() => {})
      }
    })

    return () => {
      tapSub.remove()
      stateSub.remove()
    }
  }, [router])
}
