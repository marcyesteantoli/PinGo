import { useQuery } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { useCurrentUser } from '@features/auth/hooks/useCurrentUser'

export function useIsSaved(experienceId: string) {
  const { data: user } = useCurrentUser()
  const userId = user?.id

  return useQuery<boolean>({
    queryKey: queryKeys.savedExperiences.isSaved(experienceId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_saved_experiences')
        .select('experience_id')
        .eq('user_id', userId!)
        .eq('experience_id', experienceId)
        .maybeSingle()

      if (error) throw new Error(error.message)
      return data !== null
    },
    enabled: !!userId && !!experienceId,
  })
}
