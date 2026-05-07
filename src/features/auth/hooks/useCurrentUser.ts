import { useQuery } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { DEV_MODE, DEMO_USER } from '@/dev/mockData'

export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      if (DEV_MODE) return DEMO_USER
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw new Error(error.message)
      return user
    },
    staleTime: Infinity,
  })
}
