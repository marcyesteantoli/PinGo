import { useQuery } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { useCurrentUser } from '@features/auth/hooks/useCurrentUser'
import { DEV_MODE, DEMO_USER_ID } from '@/dev/mockData'
import type { SavedExperienceItem } from '@types/index'

export function useSavedExperiences() {
  const { data: user } = useCurrentUser()
  const userId = DEV_MODE ? DEMO_USER_ID : user?.id

  return useQuery<SavedExperienceItem[]>({
    queryKey: queryKeys.savedExperiences.byUser(),
    queryFn: async () => {
      if (DEV_MODE) return []

      const { data: savedRows, error: savedError } = await supabase
        .from('user_saved_experiences')
        .select('experience_id, saved_at, note')
        .eq('user_id', userId!)
        .order('saved_at', { ascending: false })

      if (savedError) throw new Error(savedError.message)
      if (!savedRows || savedRows.length === 0) return []

      const experienceIds = savedRows.map((r) => r.experience_id)

      const [{ data: experiences, error: expError }, { data: attrRatings, error: attrError }] =
        await Promise.all([
          supabase
            .from('experiences')
            .select('id, title, type, location, trip_id')
            .in('id', experienceIds),
          supabase
            .from('experience_attribute_ratings')
            .select('experience_id, attribute, value')
            .in('experience_id', experienceIds)
            .eq('user_id', userId!),
        ])

      if (expError) throw new Error(expError.message)
      if (attrError) throw new Error(attrError.message)

      const tripIds = [...new Set((experiences ?? []).map((e) => e.trip_id).filter(Boolean))]
      const { data: trips } = await supabase
        .from('trips')
        .select('id, name')
        .in('id', tripIds)

      const expMap = new Map((experiences ?? []).map((e) => [e.id, e]))
      const tripMap = new Map((trips ?? []).map((t) => [t.id, t.name]))
      const attrMap = new Map<string, Array<{ attribute: string; value: number }>>()
      for (const r of attrRatings ?? []) {
        const list = attrMap.get(r.experience_id) ?? []
        list.push({ attribute: r.attribute, value: r.value })
        attrMap.set(r.experience_id, list)
      }

      return savedRows
        .map((row) => {
          const exp = expMap.get(row.experience_id)
          if (!exp) return null
          return {
            saved_at: row.saved_at,
            note: (row as any).note ?? null,
            experience: {
              ...exp,
              trip: exp.trip_id ? { name: tripMap.get(exp.trip_id) ?? '' } : null,
              attribute_ratings: attrMap.get(row.experience_id) ?? [],
            },
          }
        })
        .filter(Boolean) as SavedExperienceItem[]
    },
    enabled: !!userId,
  })
}
