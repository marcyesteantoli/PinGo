import { ActionSheetIOS, Linking, Platform } from 'react-native'
import { i18n } from '@/i18n'

export function openInMaps(lat: number, lng: number, label: string) {
  const query = encodeURIComponent(label)
  const appleUrl = `maps://?ll=${lat},${lng}&q=${query}`
  const googleUrl = `comgooglemaps://?q=${query}&center=${lat},${lng}`

  if (Platform.OS === 'android') {
    Linking.openURL(`geo:${lat},${lng}?q=${query}`)
    return
  }

  Linking.canOpenURL(googleUrl).then((hasGoogleMaps) => {
    if (!hasGoogleMaps) {
      Linking.openURL(appleUrl)
      return
    }

    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ['Apple Maps', 'Google Maps', i18n.t('common_cancel')],
        cancelButtonIndex: 2,
      },
      (index) => {
        if (index === 0) Linking.openURL(appleUrl)
        if (index === 1) Linking.openURL(googleUrl)
      }
    )
  })
}
