import { useMutation } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import type { LoginFormData } from '../types'

export function useSignIn() {
  return useMutation({
    mutationFn: async ({ email, password }: LoginFormData) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw new Error(error.message)
    },
  })
}
