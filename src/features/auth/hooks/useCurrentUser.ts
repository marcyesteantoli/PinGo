import { useQuery } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'

export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw new Error(error.message)
      return user
    },
    staleTime: Infinity,
  })
}
