import { useMutation } from '@tanstack/react-query'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import { supabase } from '@lib/supabase'

export function useSignInWithGoogle() {
  return useMutation({
    mutationFn: async () => {
      // Lazy import: keeps the screen from crashing on dev-client builds that predate this native module
      const { GoogleSignin, isErrorWithCode, isSuccessResponse, statusCodes } = await import(
        '@react-native-google-signin/google-signin'
      )

      GoogleSignin.configure({
        iosClientId: Constants.expoConfig?.extra?.googleIosClientId,
        webClientId: Constants.expoConfig?.extra?.googleWebClientId,
      })

      if (Platform.OS === 'android') await GoogleSignin.hasPlayServices()

      let response
      try {
        response = await GoogleSignin.signIn()
      } catch (err) {
        if (isErrorWithCode(err) && err.code === statusCodes.SIGN_IN_CANCELLED) return null
        throw err
      }
      if (!isSuccessResponse(response)) return null

      const idToken = response.data.idToken
      if (!idToken) throw new Error('No se pudo obtener el token de Google')

      const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: idToken })
      if (error) throw new Error(error.message)
      return idToken
    },
  })
}
