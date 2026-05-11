import { zodResolver } from '@hookform/resolvers/zod'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useRef } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button } from '@components/ui/Button'
import { Input } from '@components/ui/Input'
import { useSignIn } from '@features/auth/hooks/useSignIn'
import { loginSchema, type LoginFormData } from '@features/auth/types'

export default function LoginScreen() {
  const router = useRouter()
  const signIn = useSignIn()
  const passwordRef = useRef<TextInput>(null)

  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      await signIn.mutateAsync(data)
    } catch {
      // El error se muestra via signIn.error
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-surface-900" edges={['top']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerClassName="flex-grow px-6 py-8 justify-center"
          keyboardShouldPersistTaps="handled"
        >
          <View className="items-center mb-10 gap-3">
            <View className="w-16 h-16 rounded-[22px] bg-primary-500 items-center justify-center">
              <Ionicons name="airplane" size={32} color="#ffffff" />
            </View>
            <Text className="text-[28px] font-bold text-neutral-900 dark:text-neutral-50">Bienvenido</Text>
            <Text className="text-[17px] text-neutral-500 dark:text-neutral-400">Inicia sesión para continuar</Text>
          </View>

          <View className="gap-4">
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Email"
                  placeholder="tu@email.com"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  error={errors.email?.message}
                  accessibilityLabel="Campo de email"
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
                  label="Contraseña"
                  placeholder="••••••••"
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry
                  autoComplete="current-password"
                  error={errors.password?.message}
                  accessibilityLabel="Campo de contraseña"
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit(onSubmit)}
                />
              )}
            />

            {signIn.error && (
              <Text className="text-sm text-error text-center">
                {signIn.error.message}
              </Text>
            )}

            <Button
              onPress={handleSubmit(onSubmit)}
              isLoading={signIn.isPending}
              size="lg"
              className="mt-2"
            >
              Iniciar sesión
            </Button>
          </View>

          <View className="flex-row items-center justify-center mt-8 gap-1">
            <Text className="text-sm text-neutral-500 dark:text-neutral-400">¿Sin cuenta?</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text className="text-sm font-semibold text-primary-600 dark:text-primary-400">Regístrate</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
