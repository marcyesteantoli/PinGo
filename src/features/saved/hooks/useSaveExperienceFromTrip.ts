import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { DEV_MODE } from '@/dev/mockData'

export function useSaveExperienceFromTrip(tripExperienceId: string) {
  const queryClient = useQueryClient()
  const linkKey = queryKeys.savedExperiences.savedCopyForSource(tripExperienceId)
  const listKey = queryKeys.savedExperiences.byUser()

  return useMutation({
    mutationFn: async (savedExperienceId: string | null) => {
      if (DEV_MODE) return null

      if (savedExperienceId) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('No hay sesión activa')

        const { error } = await supabase
          .from('user_saved_experiences')
          .delete()
          .eq('user_id', user.id)
          .eq('experience_id', savedExperienceId)
        if (error) throw new Error(error.message)
        return null
      }

      const { data, error } = await (supabase as any)
        .rpc('save_experience_from_trip', { p_source_experience_id: tripExperienceId })
      if (error) throw new Error(error.message)
      return data as string
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: linkKey })
      queryClient.invalidateQueries({ queryKey: listKey })
    },
  })
}
