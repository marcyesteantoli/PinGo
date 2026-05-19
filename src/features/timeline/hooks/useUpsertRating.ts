import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { DEV_MODE } from '@/dev/mockData'
import type { RatingsData } from './useRatings'

export function useUpsertRating(experienceId: string) {
  const queryClient = useQueryClient()
  const qKey = queryKeys.ratings.byExperience(experienceId)

  return useMutation({
    mutationFn: async (rating: number) => {
      if (DEV_MODE) return

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No hay sesión activa')

      const { error } = await supabase
        .from('experience_ratings')
        .upsert(
          { experience_id: experienceId, user_id: user.id, rating },
          { onConflict: 'experience_id,user_id' }
        )

      if (error) throw new Error(error.message)
    },
    onMutate: async (rating) => {
      await queryClient.cancelQueries({ queryKey: qKey })
      const snapshot = queryClient.getQueryData<RatingsData>(qKey)

      queryClient.setQueryData<RatingsData>(qKey, (old) => {
        if (!old) return old
        const prevUserRating = old.userRating
        const wasRated = prevUserRating !== null

        const newCount = wasRated ? old.count : old.count + 1
        const totalBefore = (old.avg ?? 0) * old.count
        const totalAfter = wasRated
          ? totalBefore - prevUserRating + rating
          : totalBefore + rating
        const newAvg = newCount > 0
          ? Math.round((totalAfter / newCount) * 10) / 10
          : null

        return { ...old, userRating: rating, avg: newAvg, count: newCount }
      })

      return { snapshot }
    },
    onError: (_, __, ctx) => {
      if (ctx?.snapshot) {
        queryClient.setQueryData(qKey, ctx.snapshot)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: qKey })
    },
  })
}
