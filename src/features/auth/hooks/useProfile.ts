import { useQuery } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'

export type Profile = {
  id: string
  name: string
  avatar_url: string | null
  updated_at: string
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
      if (error) throw new Error(error.message)
      return data as Profile
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })
}
