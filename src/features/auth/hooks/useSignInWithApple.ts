import { useMutation } from '@tanstack/react-query'
import * as AppleAuthentication from 'expo-apple-authentication'
import { supabase } from '@lib/supabase'

export function useSignInWithApple() {
  return useMutation({
    mutationFn: async () => {
      let credential: AppleAuthentication.AppleAuthenticationCredential
      try {
        credential = await AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
        })
      } catch (err) {
        if (err instanceof Error && 'code' in err && err.code === 'ERR_REQUEST_CANCELED') return null
        throw err
      }
      if (!credential.identityToken) throw new Error('No se pudo obtener el token de Apple')

      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      })
      if (error) throw new Error(error.message)
      return credential.identityToken
    },
  })
}
