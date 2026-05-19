import { useQuery } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { useCurrentUser } from '@features/auth/hooks/useCurrentUser'
import { DEV_MODE } from '@/dev/mockData'

export function useSavedNote(experienceId: string) {
  const { data: user } = useCurrentUser()

  return useQuery<string | null>({
    queryKey: queryKeys.savedExperiences.note(experienceId),
    queryFn: async () => {
      if (DEV_MODE) return null

      const { data, error } = await (supabase as any)
        .from('user_saved_experiences')
        .select('note')
        .eq('user_id', user!.id)
        .eq('experience_id', experienceId)
        .maybeSingle()

      if (error) throw new Error(error.message)
      return data?.note ?? null
    },
    enabled: !!user && !!experienceId,
  })
}
