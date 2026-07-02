import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import * as Linking from 'expo-linking'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { Button } from '@components/ui/Button'
import { supabase } from '@lib/supabase'

function parseCallbackParams(url: string) {
  const query = url.includes('?') ? (url.split('?')[1]?.split('#')[0] ?? '') : ''
  const hash = url.includes('#') ? (url.split('#')[1] ?? '') : ''
  const params = new URLSearchParams([query, hash].filter(Boolean).join('&'))
  return { code: params.get('code'), errorDescription: params.get('error_description') }
}

export default function AuthCallbackScreen() {
  const router = useRouter()
  const { t } = useTranslation()
  const url = Linking.useURL()
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    if (!url) return

    const { code, errorDescription } = parseCallbackParams(url)

    if (errorDescription || !code) {
      setHasError(true)
      return
    }

    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      // On success the onAuthStateChange listener in app/_layout.tsx handles navigation.
      if (error) setHasError(true)
    })
  }, [url])

  if (hasError) {
    return (
      <SafeAreaView className="flex-1 bg-neutral-100 dark:bg-surface-900" edges={['top']}>
        <View className="flex-1 items-center justify-center px-6 gap-6">
          <Ionicons name="alert-circle-outline" size={48} color="#ef233c" />
          <View className="items-center gap-2">
            <Text className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 text-center">
              {t('auth_callback_error_title')}
            </Text>
            <Text className="text-base text-neutral-500 dark:text-neutral-400 text-center">
              {t('auth_callback_error_body')}
            </Text>
          </View>
          <Button onPress={() => router.replace('/(auth)/login')} variant="ghost" size="lg" className="w-full">
            {t('auth_confirm_back')}
          </Button>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-neutral-100 dark:bg-surface-900" edges={['top']}>
      <View className="flex-1 items-center justify-center px-6 gap-6">
        <LinearGradient
          colors={['#0046de', '#f43f5e']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ width: 80, height: 80, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}
        >
          <ActivityIndicator color="#ffffff" />
        </LinearGradient>
        <Text className="text-base text-neutral-500 dark:text-neutral-400 text-center">
          {t('auth_callback_verifying')}
        </Text>
      </View>
    </SafeAreaView>
  )
}
