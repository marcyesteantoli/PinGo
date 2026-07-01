import { zodResolver } from '@hookform/resolvers/zod'
import { Ionicons } from '@expo/vector-icons'
import {
  AppleAuthenticationButton,
  AppleAuthenticationButtonStyle,
  AppleAuthenticationButtonType,
} from 'expo-apple-authentication'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { ActivityIndicator, Image, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { Button } from '@components/ui/Button'
import { Input } from '@components/ui/Input'
import { useSignUp } from '@features/auth/hooks/useSignUp'
import { useSignInWithApple } from '@features/auth/hooks/useSignInWithApple'
import { useSignInWithGoogle } from '@features/auth/hooks/useSignInWithGoogle'
import { buildRegisterSchema, type RegisterFormData } from '@features/auth/types'
import { colors } from '@lib/colors'
import { cardShadow, ctaShadow } from '@lib/shadows'
import { useErrorToast } from '@lib/errorToast'
import { getErrorMessage } from '@lib/errors'
import { LEGAL_URLS } from '@/config/legal'

export default function RegisterScreen() {
  const router = useRouter()
  const signUp = useSignUp()
  const signInWithGoogle = useSignInWithGoogle()
  const signInWithApple = useSignInWithApple()
  const emailRef = useRef<TextInput>(null)
  const passwordRef = useRef<TextInput>(null)
  const showError = useErrorToast()
  const { t } = useTranslation()

  const schema = useMemo(() => buildRegisterSchema(), [t])

  useEffect(() => {
    if (signUp.error) showError(getErrorMessage(signUp.error, t))
  }, [signUp.error])

  useEffect(() => {
    if (signInWithGoogle.error) showError(getErrorMessage(signInWithGoogle.error, t))
  }, [signInWithGoogle.error])

  useEffect(() => {
    if (signInWithApple.error) showError(getErrorMessage(signInWithApple.error, t))
  }, [signInWithApple.error])

  const [termsAccepted, setTermsAccepted] = useState(false)

  const { control, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const result = await signUp.mutateAsync(data)
      if (!result.needsEmailConfirmation) {
        router.replace('/(app)/(tabs)/trips')
      }
    } catch {
      // error shown via signUp.error
    }
  }

  if (signUp.isSuccess && signUp.data?.needsEmailConfirmation) {
    return (
      <SafeAreaView className="flex-1 bg-neutral-100 dark:bg-surface-900" edges={['top']}>
        <View className="flex-1 items-center justify-center px-6 gap-6">
          <LinearGradient
            colors={['#0046de', '#f43f5e']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ width: 80, height: 80, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="mail-outline" size={36} color="#ffffff" />
          </LinearGradient>
          <View className="items-center gap-2">
            <Text className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 text-center">
              {t('auth_confirm_title')}
            </Text>
            <Text className="text-base text-neutral-500 dark:text-neutral-400 text-center">
              {t('auth_confirm_body', { email: signUp.variables?.email })}
            </Text>
          </View>
          <Button onPress={() => router.back()} variant="ghost" size="lg" className="w-full">
            {t('auth_confirm_back')}
          </Button>
        </View>
      </SafeAreaView>
    )
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
            <Text className="text-[28px] font-bold text-neutral-900 dark:text-neutral-50 mt-2">{t('auth_register_title')}</Text>
            <Text className="text-[15px] text-neutral-500 dark:text-neutral-400">{t('auth_register_subtitle')}</Text>
          </View>

          <View
            className="rounded-2xl bg-white dark:bg-surface-800 p-6 gap-5"
            style={cardShadow}
          >
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, value } }) => (
                <Input
                  label={t('auth_register_nameLabel')}
                  placeholder={t('auth_register_namePlaceholder')}
                  leftIcon="person-outline"
                  value={value}
                  onChangeText={onChange}
                  autoCapitalize="words"
                  autoComplete="name"
                  error={errors.name?.message}
                  accessibilityLabel={t('auth_register_nameA11y')}
                  returnKeyType="next"
                  onSubmitEditing={() => emailRef.current?.focus()}
                  blurOnSubmit={false}
                />
              )}
            />

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <Input
                  ref={emailRef}
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
                  placeholder={t('auth_validation_password')}
                  leftIcon="lock-closed-outline"
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry
                  autoComplete="new-password"
                  error={errors.password?.message}
                  accessibilityLabel={t('auth_login_passwordA11y')}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit(onSubmit)}
                />
              )}
            />
            {!errors.password && (
              <Text className="text-xs text-neutral-500 dark:text-neutral-400 -mt-3">
                {t('auth_register_passwordHint')}
              </Text>
            )}

            <Pressable
              onPress={() => setTermsAccepted(v => !v)}
              className="flex-row items-start gap-2"
              accessibilityRole="checkbox"
              accessibilityState={{ checked: termsAccepted }}
            >
              <Ionicons
                name={termsAccepted ? 'checkbox' : 'square-outline'}
                size={20}
                color={termsAccepted ? '#0046de' : colors.neutral[400]}
                style={{ marginTop: 1 }}
              />
              <Text className="flex-1 text-sm text-neutral-600 dark:text-neutral-400 leading-5">
                {t('auth_register_consent_prefix')}{' '}
                <Text
                  onPress={() => Linking.openURL(LEGAL_URLS.terms)}
                  className="text-secondary-600 dark:text-secondary-400 font-semibold"
                >
                  {t('auth_register_consent_terms')}
                </Text>
                {' '}{t('auth_register_consent_and')}{' '}
                <Text
                  onPress={() => Linking.openURL(LEGAL_URLS.privacy)}
                  className="text-secondary-600 dark:text-secondary-400 font-semibold"
                >
                  {t('auth_register_consent_privacy')}
                </Text>
              </Text>
            </Pressable>

            <View style={ctaShadow}>
              <Button
                onPress={handleSubmit(onSubmit)}
                isLoading={signUp.isPending}
                disabled={!termsAccepted}
                size="lg"
              >
                {t('auth_register_submit')}
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
                buttonType={AppleAuthenticationButtonType.SIGN_UP}
                buttonStyle={AppleAuthenticationButtonStyle.BLACK}
                cornerRadius={16}
                style={{ height: 52 }}
                onPress={() => signInWithApple.mutate()}
              />
            )}
          </View>

          <View className="flex-row items-center justify-center mt-8 gap-1">
            <Text className="text-sm text-neutral-500 dark:text-neutral-400">{t('auth_register_hasAccount')}</Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-sm font-semibold text-secondary-600 dark:text-secondary-400">{t('auth_register_loginLink')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
