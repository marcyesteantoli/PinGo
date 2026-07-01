import { useQuery } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { mapSupabaseError } from '@lib/errors'

export type TripRatingsMap = Record<string, { avg: number; count: number }>

export function useRatingsForTrip(tripId: string, experienceIds: string[]) {
  return useQuery<TripRatingsMap>({
    queryKey: queryKeys.ratings.byTrip(tripId),
    queryFn: async () => {
      if (!experienceIds.length) return {}

      const { data, error } = await supabase
        .from('experience_ratings_avg')
        .select('experience_id, rating_avg, rating_count')
        .in('experience_id', experienceIds)

      if (error) throw mapSupabaseError(error)

      return Object.fromEntries(
        (data ?? []).map((r) => [r.experience_id, { avg: r.rating_avg, count: r.rating_count }])
      )
    },
    enabled: experienceIds.length > 0,
  })
}
