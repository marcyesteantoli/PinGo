import { ExpoConfig, ConfigContext } from 'expo/config'

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'PinGo',
  slug: 'pin-go',
  version: '1.0.7',
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
    versionCode: 7,
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
    blockedPermissions: ['android.permission.READ_MEDIA_IMAGES', 'android.permission.READ_MEDIA_VIDEO'],
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-font',
    [
      'expo-notifications',
      {
        color: '#0046de',
        iosDisplayInForeground: true,
      },
    ],
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
        granularPermissions: [],
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
    ...(process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME
      ? [
          [
            '@react-native-google-signin/google-signin',
            { iosUrlScheme: process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME as string },
          ] satisfies [string, { iosUrlScheme: string }],
        ]
      : []),
    [
      '@sentry/react-native/expo',
      {
        organization: 'pingo-nq',
        project: 'pingo',
      },
    ],
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
