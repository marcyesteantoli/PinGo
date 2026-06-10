import AsyncStorage from '@react-native-async-storage/async-storage'

const INTRO_KEY = '@tripsync/intro_seen'

export async function getIntroSeen(): Promise<boolean> {
  const value = await AsyncStorage.getItem(INTRO_KEY)
  return value === 'true'
}

export async function setIntroSeen(): Promise<void> {
  await AsyncStorage.setItem(INTRO_KEY, 'true')
}
