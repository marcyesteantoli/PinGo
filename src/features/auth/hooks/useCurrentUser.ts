import { useQuery } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'

export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.auth.currentUser(),
    queryFn: async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw new Error(error.message)
      return user
    },
    staleTime: Infinity,
  })
}
