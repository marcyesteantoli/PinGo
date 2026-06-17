import { useEffect } from 'react'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { registerPushToken } from './pushToken'

// Global handler — must be set before any notification is received.
// Called at module import time so it takes effect immediately.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

export function useNotificationSetup() {
  useEffect(() => {
    if (!Device.isDevice) return
    registerPushToken()
  }, [])
}
