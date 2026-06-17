import AsyncStorage from '@react-native-async-storage/async-storage'
import * as StoreReview from 'expo-store-review'

const KEYS = {
  FIRST_OPEN: '@pingo/rating_first_open',
  SESSION_COUNT: '@pingo/rating_session_count',
  LAST_SHOWN: '@pingo/rating_last_shown',
  TOTAL_SHOWN: '@pingo/rating_total_shown',
} as const

const MIN_DAYS_SINCE_INSTALL = 0
const MIN_SESSIONS = 0
const MIN_DAYS_BETWEEN_PROMPTS = 60
const MAX_TOTAL_PROMPTS = 2

function daysSince(isoTimestamp: string): number {
  return (Date.now() - new Date(isoTimestamp).getTime()) / 86_400_000
}

export async function initRatingSession(): Promise<void> {
  try {
    const firstOpen = await AsyncStorage.getItem(KEYS.FIRST_OPEN)
    if (!firstOpen) {
      await AsyncStorage.setItem(KEYS.FIRST_OPEN, new Date().toISOString())
    }
    const prev = parseInt((await AsyncStorage.getItem(KEYS.SESSION_COUNT)) ?? '0', 10)
    await AsyncStorage.setItem(KEYS.SESSION_COUNT, String(prev + 1))
  } catch {
    // non-fatal
  }
}

export async function maybePromptRating(): Promise<void> {
  try {
    const isAvailable = await StoreReview.isAvailableAsync()
    if (!isAvailable) return

    const [firstOpen, sessionCountRaw, lastShown, totalShownRaw] = await Promise.all([
      AsyncStorage.getItem(KEYS.FIRST_OPEN),
      AsyncStorage.getItem(KEYS.SESSION_COUNT),
      AsyncStorage.getItem(KEYS.LAST_SHOWN),
      AsyncStorage.getItem(KEYS.TOTAL_SHOWN),
    ])

    if (!firstOpen || daysSince(firstOpen) < MIN_DAYS_SINCE_INSTALL) return
    if (parseInt(sessionCountRaw ?? '0', 10) < MIN_SESSIONS) return
    if (parseInt(totalShownRaw ?? '0', 10) >= MAX_TOTAL_PROMPTS) return
    if (lastShown && daysSince(lastShown) < MIN_DAYS_BETWEEN_PROMPTS) return

    await new Promise<void>((r) => setTimeout(r, 800))
    await StoreReview.requestReview()

    const newTotal = parseInt(totalShownRaw ?? '0', 10) + 1
    await Promise.all([
      AsyncStorage.setItem(KEYS.LAST_SHOWN, new Date().toISOString()),
      AsyncStorage.setItem(KEYS.TOTAL_SHOWN, String(newTotal)),
    ])
  } catch {
    // never let rating prompt crash the app
  }
}
