import { useQuery } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { useCurrentUser } from '@features/auth/hooks/useCurrentUser'
import type { ExperienceRating } from '@app-types/index'

export type RatingWithProfile = ExperienceRating & {
  profiles: { name: string; avatar_url: string | null } | null
}

export type RatingsData = {
  ratings: RatingWithProfile[]
  userRating: number | null
  avg: number | null
  count: number
}

export function useRatings(experienceId: string) {
  const { data: user } = useCurrentUser()
  const userId = user?.id

  return useQuery<RatingsData>({
    queryKey: queryKeys.ratings.byExperience(experienceId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('experience_ratings')
        .select('*, profiles(name, avatar_url)')
        .eq('experience_id', experienceId)

      if (error) throw new Error(error.message)

      const ratings = (data ?? []) as RatingWithProfile[]
      const count = ratings.length
      const avg = count > 0
        ? Math.round((ratings.reduce((sum, r) => sum + r.rating, 0) / count) * 10) / 10
        : null
      const userRating = ratings.find((r) => r.user_id === userId)?.rating ?? null

      return { ratings, userRating, avg, count }
    },
    enabled: !!experienceId,
  })
}
