import { useQuery } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { mapSupabaseError } from '@lib/errors'

export type Profile = {
  id: string
  name: string
  avatar_url: string | null
  updated_at: string
  is_pro: boolean
  pro_expires_at: string | null
}

export function useProfile(userId?: string) {
  return useQuery({
    queryKey: queryKeys.auth.profile(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId!)
        .single()
      if (error) throw mapSupabaseError(error)
      return data as Profile
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })
}
