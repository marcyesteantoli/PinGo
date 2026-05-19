import { useQuery } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { useCurrentUser } from '@features/auth/hooks/useCurrentUser'
import { DEV_MODE, DEMO_USER_ID } from '@/dev/mockData'
import type { AttributeRatingsData } from '@types/index'

export function useAttributeRatings(experienceId: string) {
  const { data: user } = useCurrentUser()
  const userId = DEV_MODE ? DEMO_USER_ID : user?.id

  return useQuery<AttributeRatingsData>({
    queryKey: queryKeys.attributeRatings.byExperience(experienceId),
    queryFn: async () => {
      if (DEV_MODE) {
        return { userValues: {}, groupAvg: {}, count: 0 }
      }

      type Row = { user_id: string; attribute: string; value: number }
      const { data: rawData, error } = await (supabase as any)
        .from('experience_attribute_ratings')
        .select('user_id, attribute, value')
        .eq('experience_id', experienceId)

      if (error) throw new Error(error.message)

      const rows: Row[] = rawData ?? []

      const userValues: Record<string, number> = {}
      rows
        .filter((r) => r.user_id === userId)
        .forEach((r) => { userValues[r.attribute] = r.value })

      const grouped: Record<string, number[]> = {}
      rows.forEach((r) => {
        if (!grouped[r.attribute]) grouped[r.attribute] = []
        grouped[r.attribute].push(r.value)
      })

      const groupAvg: Record<string, number> = {}
      Object.entries(grouped).forEach(([attr, vals]) => {
        groupAvg[attr] = Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10
      })

      const userIds = new Set(rows.map((r) => r.user_id))
      const count = userIds.size

      return { userValues, groupAvg, count }
    },
    enabled: !!experienceId,
  })
}
