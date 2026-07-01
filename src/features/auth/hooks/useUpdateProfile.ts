import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { mapSupabaseError } from '@lib/errors'
import type { Profile } from './useProfile'

type UpdateProfileInput = {
  userId: string
  name?: string
  avatar_url?: string | null
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, name, avatar_url }: UpdateProfileInput) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({ name, avatar_url, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single()
      if (error) throw mapSupabaseError(error)
      return data as Profile
    },
    onSuccess: (data, { userId }) => {
      queryClient.setQueryData(queryKeys.auth.profile(userId), data)
    },
  })
}
