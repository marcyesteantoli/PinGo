import { ExpoConfig, ConfigContext } from 'expo/config'

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'PinGo',
  slug: 'pin-go',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'pingo',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/images/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.tfm.pingo',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    package: 'com.tfm.pingo',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-font',
    [
      'expo-image-picker',
      { photosPermission: 'La app necesita acceso a tus fotos para añadir recuerdos.' },
    ],
    [
      'expo-media-library',
      {
        photosPermission: 'PinGo necesita acceso a tu galería para guardar fotos.',
        savePhotosPermission: 'PinGo necesita permiso para guardar fotos en tu galería.',
        isAccessMediaLocationEnabled: true,
        audioPermission: false,
      },
    ],
    '@react-native-community/datetimepicker',
    // TODO: when adding Google Maps API key, add the react-native-maps plugin here:
    // ['react-native-maps', { googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY }]
    [
      'expo-share-intent',
      {
        iosActivationRules: {
          NSExtensionActivationSupportsAttachmentsWithMaxCount: 1,
        },
        iosAppGroupIdentifier: 'group.com.tfm.pingo',
        androidIntentFilters: ['image/*', '*/*'],
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  },
})
