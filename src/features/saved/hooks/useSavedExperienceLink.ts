import { useQuery } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { useCurrentUser } from '@features/auth/hooks/useCurrentUser'
import { DEV_MODE, DEMO_USER_ID } from '@/dev/mockData'

export type SavedExperienceLink = { experienceId: string } | null

export function useSavedExperienceLink(tripExperienceId: string) {
  const { data: user } = useCurrentUser()
  const userId = DEV_MODE ? DEMO_USER_ID : user?.id

  return useQuery<SavedExperienceLink>({
    queryKey: queryKeys.savedExperiences.savedCopyForSource(tripExperienceId),
    queryFn: async () => {
      if (DEV_MODE) return null

      const { data, error } = await (supabase as any)
        .from('user_saved_experiences')
        .select('experience_id')
        .eq('user_id', userId!)
        .eq('source_experience_id', tripExperienceId)
        .maybeSingle()

      if (error) throw new Error(error.message)
      return data ? { experienceId: data.experience_id } : null
    },
    enabled: !!userId && !!tripExperienceId,
  })
}
