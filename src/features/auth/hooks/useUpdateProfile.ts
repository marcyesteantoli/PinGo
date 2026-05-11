import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { DEV_MODE } from '@/dev/mockData'
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
      if (DEV_MODE) {
        const current = queryClient.getQueryData<Profile>(queryKeys.auth.profile(userId))
        return { ...current, name: name ?? current?.name, avatar_url: avatar_url ?? current?.avatar_url }
      }
      const { data, error } = await supabase
        .from('profiles')
        .update({ name, avatar_url, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single()
      if (error) throw new Error(error.message)
      return data as Profile
    },
    onSuccess: (data, { userId }) => {
      queryClient.setQueryData(queryKeys.auth.profile(userId), data)
    },
  })
}
