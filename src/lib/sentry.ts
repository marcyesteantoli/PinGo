import * as Sentry from '@sentry/react-native'

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN

export function initSentry() {
  if (!DSN) return

  Sentry.init({
    dsn: DSN,
    tracesSampleRate: 0,
    enableTracing: false,
    enableNativeCrashHandling: true,
    attachStacktrace: true,
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30000,
    enabled: !__DEV__,
    environment: __DEV__ ? 'development' : 'production',
  })
}

export { Sentry }
