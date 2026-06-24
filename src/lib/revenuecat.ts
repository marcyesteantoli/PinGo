import { Platform } from 'react-native'
import Purchases, { CustomerInfo, LOG_LEVEL } from 'react-native-purchases'

export function initRevenueCat(userId: string) {
  const apiKey = Platform.OS === 'ios'
    ? process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS!
    : process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID!
  Purchases.configure({ apiKey, appUserID: userId })
  if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG)
}

export async function logoutRevenueCat(): Promise<void> {
  try {
    await Purchases.logOut()
  } catch {
    // Safe to ignore — user may not have been logged in to RC
  }
}

export function isEntitled(customerInfo: CustomerInfo): boolean {
  return customerInfo.entitlements.active['PinGo Pro'] !== undefined
}
