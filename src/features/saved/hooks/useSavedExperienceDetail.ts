import { useQuery } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { useCurrentUser } from '@features/auth/hooks/useCurrentUser'
import { DEV_MODE } from '@/dev/mockData'
import type { Experience } from '@types/index'

export type SavedExperienceDetail = {
  note: string | null
  experience: {
    id: string
    title: string
    type: Experience['type']
    location: { name: string; lat: number; lng: number } | null
    trip_id: string
    trip: { name: string } | null
  }
  attributeRatings: Record<string, number>
  ratedCount: number
}

export function useSavedExperienceDetail(experienceId: string) {
  const { data: user } = useCurrentUser()

  return useQuery<SavedExperienceDetail | null>({
    queryKey: queryKeys.savedExperiences.detail(experienceId),
    queryFn: async () => {
      if (DEV_MODE) return null

      const userId = user!.id

      const [
        { data: savedRow, error: savedError },
        { data: exp, error: expError },
        { data: attrRatings, error: attrError },
      ] = await Promise.all([
        (supabase as any)
          .from('user_saved_experiences')
          .select('note')
          .eq('user_id', userId)
          .eq('experience_id', experienceId)
          .maybeSingle(),
        supabase
          .from('experiences')
          .select('id, title, type, location, trip_id')
          .eq('id', experienceId)
          .single(),
        supabase
          .from('experience_attribute_ratings')
          .select('attribute, value')
          .eq('experience_id', experienceId)
          .eq('user_id', userId),
      ])

      if (savedError) throw new Error(savedError.message)
      if (expError) throw new Error(expError.message)
      if (attrError) throw new Error(attrError.message)
      if (!exp) return null

      let tripName: string | null = null
      if (exp.trip_id) {
        const { data: trip } = await supabase
          .from('trips')
          .select('name')
          .eq('id', exp.trip_id)
          .single()
        tripName = trip?.name ?? null
      }

      const rawLoc = exp.location
      const location =
        typeof rawLoc === 'object' &&
        rawLoc !== null &&
        'name' in rawLoc &&
        'lat' in rawLoc &&
        'lng' in rawLoc &&
        typeof (rawLoc as { name: unknown }).name === 'string'
          ? (rawLoc as { name: string; lat: number; lng: number })
          : null

      const attributeRatings: Record<string, number> = {}
      for (const r of attrRatings ?? []) {
        attributeRatings[r.attribute] = r.value
      }

      return {
        note: savedRow?.note ?? null,
        experience: {
          id: exp.id,
          title: exp.title,
          type: exp.type as Experience['type'],
          location,
          trip_id: exp.trip_id,
          trip: tripName ? { name: tripName } : null,
        },
        attributeRatings,
        ratedCount: Object.keys(attributeRatings).length,
      }
    },
    enabled: !!user && !!experienceId && !DEV_MODE,
  })
}
