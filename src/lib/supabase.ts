import { createClient } from '@supabase/supabase-js'
import { AppState, Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import type { Database } from '../types/database'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

const LargeSecureStore = {
  async getItem(key: string) {
    const chunkCount = await SecureStore.getItemAsync(`${key}_chunkCount`)
    if (!chunkCount) return null
    let value = ''
    for (let i = 0; i < parseInt(chunkCount); i++) {
      const chunk = await SecureStore.getItemAsync(`${key}_chunk_${i}`)
      if (chunk === null) return null
      value += chunk
    }
    return value
  },
  async setItem(key: string, value: string) {
    const chunkSize = 1900
    const chunks = Math.ceil(value.length / chunkSize)
    await SecureStore.setItemAsync(`${key}_chunkCount`, String(chunks))
    for (let i = 0; i < chunks; i++) {
      await SecureStore.setItemAsync(
        `${key}_chunk_${i}`,
        value.slice(i * chunkSize, (i + 1) * chunkSize)
      )
    }
  },
  async removeItem(key: string) {
    const chunkCount = await SecureStore.getItemAsync(`${key}_chunkCount`)
    if (!chunkCount) return
    for (let i = 0; i < parseInt(chunkCount); i++) {
      await SecureStore.deleteItemAsync(`${key}_chunk_${i}`)
    }
    await SecureStore.deleteItemAsync(`${key}_chunkCount`)
  },
}

const webStorage = {
  getItem: (key: string) => Promise.resolve(localStorage.getItem(key)),
  setItem: (key: string, value: string) => {
    localStorage.setItem(key, value)
    return Promise.resolve()
  },
  removeItem: (key: string) => {
    localStorage.removeItem(key)
    return Promise.resolve()
  },
}

const storage = Platform.OS === 'web' ? webStorage : LargeSecureStore

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh()
  } else {
    supabase.auth.stopAutoRefresh()
  }
})
