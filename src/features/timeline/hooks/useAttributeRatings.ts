import { useQuery } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { useCurrentUser } from '@features/auth/hooks/useCurrentUser'
import type { AttributeRatingsData } from '@app-types/index'

export function useAttributeRatings(experienceId: string) {
  const { data: user } = useCurrentUser()
  const userId = user?.id

  return useQuery<AttributeRatingsData>({
    queryKey: queryKeys.attributeRatings.byExperience(experienceId),
    queryFn: async () => {
      if (!userId) return { userValues: {}, groupAvg: {}, count: 0 }

      type Row = { attribute: string; value: number }
      const { data: rawData, error } = await (supabase as any)
        .from('experience_attribute_ratings')
        .select('attribute, value')
        .eq('experience_id', experienceId)
        .eq('user_id', userId)

      if (error) throw new Error(error.message)

      const rows: Row[] = rawData ?? []
      const userValues: Record<string, number> = {}
      rows.forEach((r) => { userValues[r.attribute] = r.value })

      return { userValues, groupAvg: {}, count: 0 }
    },
    enabled: !!experienceId && !!userId,
  })
}
