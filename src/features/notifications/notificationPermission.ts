import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import AsyncStorage from '@react-native-async-storage/async-storage'

const KEYS = {
  DEFER_COUNT: '@pingo/notif_defer_count',
  LAST_DEFER_AT: '@pingo/notif_last_defer_at',
} as const

const MAX_DEFERS = 2
const DAYS_BETWEEN_DEFERS = 7

export async function getPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
  if (!Device.isDevice) return 'denied'
  const { status } = await Notifications.getPermissionsAsync()
  return status as 'granted' | 'denied' | 'undetermined'
}

export async function requestPermission(): Promise<boolean> {
  if (!Device.isDevice) return false
  const { status } = await Notifications.requestPermissionsAsync()
  return status === 'granted'
}

export async function shouldShowPermissionPrompt(): Promise<boolean> {
  if (!Device.isDevice) return false

  const status = await getPermissionStatus()
  if (status === 'granted' || status === 'denied') return false

  const deferCount = parseInt(
    (await AsyncStorage.getItem(KEYS.DEFER_COUNT)) ?? '0',
    10
  )
  if (deferCount >= MAX_DEFERS) return false

  const lastDeferAt = await AsyncStorage.getItem(KEYS.LAST_DEFER_AT)
  if (lastDeferAt) {
    const daysSince = (Date.now() - new Date(lastDeferAt).getTime()) / 86_400_000
    if (daysSince < DAYS_BETWEEN_DEFERS) return false
  }

  return true
}

export async function deferPermissionPrompt(): Promise<void> {
  const deferCount = parseInt(
    (await AsyncStorage.getItem(KEYS.DEFER_COUNT)) ?? '0',
    10
  )
  await Promise.all([
    AsyncStorage.setItem(KEYS.DEFER_COUNT, String(deferCount + 1)),
    AsyncStorage.setItem(KEYS.LAST_DEFER_AT, new Date().toISOString()),
  ])
}
