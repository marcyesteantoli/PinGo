import { zodResolver } from '@hookform/resolvers/zod'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useRef } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button } from '@components/ui/Button'
import { Input } from '@components/ui/Input'
import { useSignUp } from '@features/auth/hooks/useSignUp'
import { registerSchema, type RegisterFormData } from '@features/auth/types'

export default function RegisterScreen() {
  const router = useRouter()
  const signUp = useSignUp()
  const emailRef = useRef<TextInput>(null)
  const passwordRef = useRef<TextInput>(null)

  const { control, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await signUp.mutateAsync(data)
    } catch {
      // El error se muestra via signUp.error
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
            <View className="w-16 h-16 rounded-2xl bg-primary-500 items-center justify-center">
              <Ionicons name="airplane" size={32} color="#ffffff" />
            </View>
            <Text className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">Crear cuenta</Text>
            <Text className="text-base text-neutral-500 dark:text-neutral-400">Únete y empieza a planificar</Text>
          </View>

          <View className="gap-4">
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Nombre"
                  placeholder="Tu nombre"
                  value={value}
                  onChangeText={onChange}
                  autoCapitalize="words"
                  autoComplete="name"
                  error={errors.name?.message}
                  accessibilityLabel="Campo de nombre"
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
                  placeholder="Mínimo 6 caracteres"
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry
                  autoComplete="new-password"
                  error={errors.password?.message}
                  accessibilityLabel="Campo de contraseña"
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit(onSubmit)}
                />
              )}
            />

            {signUp.error && (
              <Text className="text-sm text-error text-center">
                {signUp.error.message}
              </Text>
            )}

            <Button
              onPress={handleSubmit(onSubmit)}
              isLoading={signUp.isPending}
              size="lg"
              className="mt-2"
            >
              Crear cuenta
            </Button>
          </View>

          <View className="flex-row items-center justify-center mt-8 gap-1">
            <Text className="text-sm text-neutral-500 dark:text-neutral-400">¿Ya tienes cuenta?</Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-sm font-semibold text-primary-600 dark:text-primary-400">Inicia sesión</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
