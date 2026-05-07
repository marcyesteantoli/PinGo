import { useMutation } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import type { RegisterFormData } from '../types'

export function useSignUp() {
  return useMutation({
    mutationFn: async ({ name, email, password }: RegisterFormData) => {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) throw new Error(error.message)
      if (!data.user) throw new Error('No se pudo crear la cuenta')

      const { error: profileError } = await supabase
        .from('profiles')
        .insert({ id: data.user.id, name })

      if (profileError) {
        console.error('Error creating profile:', profileError.message)
      }
    },
  })
}
