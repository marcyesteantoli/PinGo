import { useMutation } from '@tanstack/react-query'
import * as Linking from 'expo-linking'
import { supabase } from '@lib/supabase'
import { AppError, mapAuthError } from '@lib/errors'
import type { RegisterFormData } from '../types'

export function useSignUp() {
  return useMutation({
    mutationFn: async ({ name, email, password }: RegisterFormData) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name }, emailRedirectTo: Linking.createURL('/callback') },
      })
      if (error) throw mapAuthError(error)
      if (!data.user) throw new AppError('unexpected')
      return { needsEmailConfirmation: !data.session }
    },
  })
}
