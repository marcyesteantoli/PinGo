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

      // 1. Fetch saved rows (includes Phase 2 fields added by migration)
      const { data: savedRows, error: savedError } = await supabase
        .from('user_saved_experiences')
        .select('experience_id, saved_at, note, tags, would_return, price_paid, cover_photo_url')
        .eq('user_id', userId!)
        .order('saved_at', { ascending: false })

      if (savedError) throw new Error(savedError.message)
      if (!savedRows || savedRows.length === 0) return []

      const experienceIds = savedRows.map((r) => r.experience_id)

      // 2. Fetch experiences + attribute ratings in parallel
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

      // 3. Assemble maps
      const expMap = new Map((experiences ?? []).map((e) => [e.id, e]))
      const tripIds = [...new Set((experiences ?? []).map((e) => e.trip_id).filter(Boolean))]
      const { data: trips } = await supabase.from('trips').select('id, name').in('id', tripIds)
      const tripMap = new Map((trips ?? []).map((t) => [t.id, t.name]))
      const attrMap = new Map<string, Array<{ attribute: string; value: number }>>()
      for (const r of attrRatings ?? []) {
        const list = attrMap.get(r.experience_id) ?? []
        list.push({ attribute: r.attribute, value: r.value })
        attrMap.set(r.experience_id, list)
      }

      // 4. Batch-generate signed URLs for cover photos stored as storage paths
      const photoPaths = savedRows
        .map((r) => (r as any).cover_photo_url as string | null | undefined)
        .filter((p): p is string => !!p)

      const photoUrlMap = new Map<string, string>()
      if (photoPaths.length > 0) {
        const { data: signed } = await supabase.storage
          .from('saved-photos')
          .createSignedUrls(photoPaths, 3600)
        for (const item of signed ?? []) {
          if (item.signedUrl) photoUrlMap.set(item.path, item.signedUrl)
        }
      }

      // 5. Build result items
      return savedRows
        .map((row) => {
          const exp = expMap.get(row.experience_id)
          if (!exp) return null

          const storagePath = ((row as any).cover_photo_url as string | null | undefined) ?? null
          const coverPhotoUrl = storagePath ? (photoUrlMap.get(storagePath) ?? null) : null

          return {
            saved_at: row.saved_at,
            note: (row as any).note ?? null,
            coverPhotoUrl,
            tags: (row as any).tags ?? [],
            would_return: (row as any).would_return ?? null,
            price_paid: (row as any).price_paid ?? null,
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
