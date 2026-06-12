import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { DEV_MODE } from '@/dev/mockData'
import type { RatingsData } from './useRatings'
import type { TripRatingsMap } from './useRatingsForTrip'

export function useDeleteRating(experienceId: string, tripId?: string) {
  const queryClient = useQueryClient()
  const qKey = queryKeys.ratings.byExperience(experienceId)
  const tripKey = tripId ? queryKeys.ratings.byTrip(tripId) : null

  return useMutation({
    mutationFn: async () => {
      if (DEV_MODE) return

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No hay sesión activa')

      const { error } = await supabase
        .from('experience_ratings')
        .delete()
        .eq('experience_id', experienceId)
        .eq('user_id', user.id)

      if (error) throw new Error(error.message)
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: qKey })
      const snapshot = queryClient.getQueryData<RatingsData>(qKey)

      queryClient.setQueryData<RatingsData>(qKey, (old) => {
        if (!old) return old
        const prevUserRating = old.userRating
        if (prevUserRating === null) return old

        const newCount = old.count - 1
        const totalBefore = (old.avg ?? 0) * old.count
        const totalAfter = totalBefore - prevUserRating
        const newAvg = newCount > 0
          ? Math.round((totalAfter / newCount) * 10) / 10
          : null

        return { ...old, userRating: null, avg: newAvg, count: newCount }
      })

      let tripSnapshot: TripRatingsMap | undefined
      if (tripKey) {
        await queryClient.cancelQueries({ queryKey: tripKey })
        tripSnapshot = queryClient.getQueryData<TripRatingsMap>(tripKey)

        queryClient.setQueryData<TripRatingsMap>(tripKey, (old) => {
          if (!old) return old
          const current = old[experienceId]
          const prevUserRating = snapshot?.userRating ?? null
          if (prevUserRating === null || !current) return old

          const newCount = current.count - 1
          const totalBefore = current.avg * current.count
          const totalAfter = totalBefore - prevUserRating
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
