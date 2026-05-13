import { useMutation } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import type { RegisterFormData } from '../types'

export function useSignUp() {
  return useMutation({
    mutationFn: async ({ name, email, password }: RegisterFormData) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      })
      if (error) throw new Error(error.message)
      if (!data.user) throw new Error('No se pudo crear la cuenta')
      return { needsEmailConfirmation: !data.session }
    },
  })
}
