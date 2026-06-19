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
    bundleIdentifier: 'io.pingo.app',
    config: {
      googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS,
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    package: 'io.pingo.app',
    config: {
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID,
      },
    },
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
    'expo-apple-authentication',
    [
      'expo-share-intent',
      {
        iosActivationRules: {
          NSExtensionActivationSupportsAttachmentsWithMaxCount: 1,
        },
        iosAppGroupIdentifier: 'group.io.pingo.app',
        androidIntentFilters: ['image/*', '*/*'],
      },
    ],
    // Sign in with Google requires EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME to be set (Google Cloud Console
    // OAuth iOS client reversed-client-id) — the plugin throws at config-eval time without it.
    // TODO(android-google): Create Android OAuth client in Google Cloud Console.
    //   1. Run `eas credentials --platform android` to get the debug SHA-1 keystore fingerprint.
    //   2. After first production build, add the production SHA-1 to the same Android client.
    //   3. Both SHA-1s can coexist in one client — no extra env var needed.
    ...(process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME
      ? [
          [
            '@react-native-google-signin/google-signin',
            { iosUrlScheme: process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME as string },
          ] satisfies [string, { iosUrlScheme: string }],
        ]
      : []),
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    eas: {
      projectId: '03654de5-a800-4d73-9b60-a67bfb42d98c',
    },
  },
})
