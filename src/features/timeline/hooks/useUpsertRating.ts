import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import type { RatingsData } from './useRatings'
import type { TripRatingsMap } from './useRatingsForTrip'

export function useUpsertRating(experienceId: string, tripId?: string) {
  const queryClient = useQueryClient()
  const qKey = queryKeys.ratings.byExperience(experienceId)
  const tripKey = tripId ? queryKeys.ratings.byTrip(tripId) : null

  return useMutation({
    mutationFn: async (rating: number) => {
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

      let tripSnapshot: TripRatingsMap | undefined
      if (tripKey) {
        await queryClient.cancelQueries({ queryKey: tripKey })
        tripSnapshot = queryClient.getQueryData<TripRatingsMap>(tripKey)

        queryClient.setQueryData<TripRatingsMap>(tripKey, (old) => {
          if (!old) return old
          const current = old[experienceId]
          const prevUserRating = snapshot?.userRating ?? null
          const wasRated = prevUserRating !== null

          const prevCount = current?.count ?? 0
          const newCount = wasRated ? prevCount : prevCount + 1
          const totalBefore = (current?.avg ?? 0) * prevCount
          const totalAfter = wasRated
            ? totalBefore - prevUserRating + rating
            : totalBefore + rating
          const newAvg = newCount > 0
            ? Math.round((totalAfter / newCount) * 10) / 10
            : 0

          return { ...old, [experienceId]: { avg: newAvg, count: newCount } }
        })
      }

      return { snapshot, tripSnapshot }
    },
    onError: (_, __, ctx) => {
      if (ctx?.snapshot) {
        queryClient.setQueryData(qKey, ctx.snapshot)
      }
      if (tripKey && ctx?.tripSnapshot) {
        queryClient.setQueryData(tripKey, ctx.tripSnapshot)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: qKey })
      if (tripKey) {
        queryClient.invalidateQueries({ queryKey: tripKey })
      }
    },
  })
}
