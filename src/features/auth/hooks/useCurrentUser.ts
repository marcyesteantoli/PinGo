import { useQuery } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'

export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.auth.currentUser(),
    queryFn: async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) {
        if (error.message === 'Auth session missing!') return null
        throw new Error(error.message)
      }
      return user
    },
    staleTime: Infinity,
  })
}
