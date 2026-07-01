import { zodResolver } from '@hookform/resolvers/zod'
import { Ionicons } from '@expo/vector-icons'
import {
  AppleAuthenticationButton,
  AppleAuthenticationButtonStyle,
  AppleAuthenticationButtonType,
} from 'expo-apple-authentication'
import { useRouter } from 'expo-router'
import { useEffect, useMemo, useRef } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { Button } from '@components/ui/Button'
import { Input } from '@components/ui/Input'
import { useSignIn } from '@features/auth/hooks/useSignIn'
import { useSignInWithApple } from '@features/auth/hooks/useSignInWithApple'
import { useSignInWithGoogle } from '@features/auth/hooks/useSignInWithGoogle'
import { buildLoginSchema, type LoginFormData } from '@features/auth/types'
import { colors } from '@lib/colors'
import { cardShadow, ctaShadow } from '@lib/shadows'
import { useErrorToast } from '@lib/errorToast'
import { getErrorMessage } from '@lib/errors'

export default function LoginScreen() {
  const router = useRouter()
  const signIn = useSignIn()
  const signInWithGoogle = useSignInWithGoogle()
  const signInWithApple = useSignInWithApple()
  const passwordRef = useRef<TextInput>(null)
  const showError = useErrorToast()
  const { t } = useTranslation()

  const schema = useMemo(() => buildLoginSchema(), [t])

  useEffect(() => {
    if (signIn.error) showError(getErrorMessage(signIn.error, t))
  }, [signIn.error])

  useEffect(() => {
    if (signInWithGoogle.error) showError(getErrorMessage(signInWithGoogle.error, t))
  }, [signInWithGoogle.error])

  useEffect(() => {
    if (signInWithApple.error) showError(getErrorMessage(signInWithApple.error, t))
  }, [signInWithApple.error])

  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      await signIn.mutateAsync(data)
      router.replace('/(app)/(tabs)/trips')
    } catch {
      // error shown via signIn.error
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-neutral-100 dark:bg-surface-900" edges={['top']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerClassName="flex-grow px-6 py-8 justify-center"
          keyboardShouldPersistTaps="handled"
        >
          <View className="items-center mb-10 gap-2">
            <View
              className="w-[80px] h-[80px] rounded-[22px] items-center justify-center bg-white dark:bg-surface-800"
              style={cardShadow}
            >
              <Image
                source={require('../../assets/images/icon.png')}
                style={{ width: 56, height: 56, borderRadius: 14 }}
              />
            </View>
            <Text className="text-[28px] font-bold text-neutral-900 dark:text-neutral-50 mt-2">{t('auth_login_title')}</Text>
            <Text className="text-[15px] text-neutral-500 dark:text-neutral-400">{t('auth_login_subtitle')}</Text>
          </View>

          <View
            className="rounded-2xl bg-white dark:bg-surface-800 p-6 gap-5"
            style={cardShadow}
          >
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <Input
                  label={t('auth_login_emailLabel')}
                  placeholder={t('auth_login_emailPlaceholder')}
                  leftIcon="mail-outline"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  error={errors.email?.message}
                  accessibilityLabel={t('auth_login_emailA11y')}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  blurOnSubmit={false}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <Input
                  ref={passwordRef}
                  label={t('auth_login_passwordLabel')}
                  placeholder={t('auth_login_passwordPlaceholder')}
                  leftIcon="lock-closed-outline"
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry
                  autoComplete="current-password"
                  error={errors.password?.message}
                  accessibilityLabel={t('auth_login_passwordA11y')}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit(onSubmit)}
                />
              )}
            />

            <View style={ctaShadow}>
              <Button
                onPress={handleSubmit(onSubmit)}
                isLoading={signIn.isPending}
                size="lg"
              >
                {t('auth_login_submit')}
              </Button>
            </View>
          </View>

          <View className="flex-row items-center gap-3 my-6">
            <View className="flex-1 h-px bg-neutral-200 dark:bg-surface-700" />
            <Text className="text-sm text-neutral-500 dark:text-neutral-400">{t('auth_social_divider')}</Text>
            <View className="flex-1 h-px bg-neutral-200 dark:bg-surface-700" />
          </View>

          <View className="gap-3">
            <Pressable
              onPress={() => signInWithGoogle.mutate()}
              disabled={signInWithGoogle.isPending}
              className="flex-row items-center justify-center gap-2 px-6 py-3.5 rounded-2xl border border-neutral-300 bg-white dark:bg-surface-800 dark:border-neutral-600"
              accessibilityRole="button"
              accessibilityLabel={t('auth_social_google')}
            >
              {signInWithGoogle.isPending ? (
                <ActivityIndicator color={colors.neutral[600]} />
              ) : (
                <>
                  <Ionicons name="logo-google" size={20} color={colors.neutral[700]} />
                  <Text className="text-[17px] font-semibold text-neutral-700 dark:text-neutral-200">
                    {t('auth_social_google')}
                  </Text>
                </>
              )}
            </Pressable>

            {Platform.OS === 'ios' && (
              <AppleAuthenticationButton
                buttonType={AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthenticationButtonStyle.BLACK}
                cornerRadius={16}
                style={{ height: 52 }}
                onPress={() => signInWithApple.mutate()}
              />
            )}
          </View>

          <View className="flex-row items-center justify-center mt-8 gap-1">
            <Text className="text-sm text-neutral-500 dark:text-neutral-400">{t('auth_login_noAccount')}</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text className="text-sm font-semibold text-secondary-600 dark:text-secondary-400">{t('auth_login_registerLink')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
