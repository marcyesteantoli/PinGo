import { useQuery } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { DEV_MODE, DEMO_USER_ID } from '@/dev/mockData'

export type Profile = {
  id: string
  name: string
  avatar_url: string | null
  updated_at: string
}

const DEMO_PROFILE: Profile = {
  id: DEMO_USER_ID,
  name: 'Marc Yeste',
  avatar_url: null,
  updated_at: '',
}

export function useProfile(userId?: string) {
  return useQuery({
    queryKey: queryKeys.auth.profile(userId),
    queryFn: async () => {
      if (DEV_MODE) return DEMO_PROFILE
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId!)
        .single()
      if (error) throw new Error(error.message)
      return data as Profile
    },
    enabled: !!userId || DEV_MODE,
    staleTime: 5 * 60 * 1000,
  })
}
