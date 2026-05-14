import AsyncStorage from '@react-native-async-storage/async-storage'

const KEY = 'last_active_trip_id'

export async function saveLastActiveTripId(tripId: string) {
  await AsyncStorage.setItem(KEY, tripId)
}

export async function getLastActiveTripId(): Promise<string | null> {
  return AsyncStorage.getItem(KEY)
}
