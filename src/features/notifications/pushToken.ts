import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'
import Constants from 'expo-constants'
import { supabase } from '@lib/supabase'

function getProjectId(): string | undefined {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants as any).easConfig?.projectId
  )
}

export async function registerPushToken(): Promise<void> {
  if (!Device.isDevice) return

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return

  const { status } = await Notifications.getPermissionsAsync()
  if (status !== 'granted') return

  try {
    const projectId = getProjectId()
    const { data: token } = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    )
    const platform = Platform.OS === 'ios' ? 'ios' : 'android'

    await supabase
      .from('push_tokens')
      .upsert({ token, platform }, { onConflict: 'user_id,token' })
  } catch {
    // non-fatal — push registration failure must never break the app
  }
}

export async function unregisterPushToken(): Promise<void> {
  if (!Device.isDevice) return

  try {
    const projectId = getProjectId()
    const { data: token } = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    )

    await supabase.from('push_tokens').delete().eq('token', token)
  } catch {
    // non-fatal
  }
}
