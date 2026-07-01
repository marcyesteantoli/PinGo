import { useMutation } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { AppError, mapAuthError } from '@lib/errors'
import type { RegisterFormData } from '../types'

export function useSignUp() {
  return useMutation({
    mutationFn: async ({ name, email, password }: RegisterFormData) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      })
      if (error) throw mapAuthError(error)
      if (!data.user) throw new AppError('unexpected')
      return { needsEmailConfirmation: !data.session }
    },
  })
}
