import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { DEV_MODE } from '@/dev/mockData'
import type { AttributeRatingsData } from '@types/index'

export function useUpsertAttributeRating(experienceId: string) {
  const queryClient = useQueryClient()
  const qKey = queryKeys.attributeRatings.byExperience(experienceId)

  return useMutation({
    mutationFn: async ({ attribute, value }: { attribute: string; value: number }) => {
      if (DEV_MODE) return

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No hay sesión activa')

      const { error } = await (supabase as any)
        .from('experience_attribute_ratings')
        .upsert(
          { experience_id: experienceId, user_id: user.id, attribute, value },
          { onConflict: 'experience_id,user_id,attribute' }
        )

      if (error) throw new Error(error.message)
    },
    onMutate: async ({ attribute, value }) => {
      await queryClient.cancelQueries({ queryKey: qKey })
      const snapshot = queryClient.getQueryData<AttributeRatingsData>(qKey)

      queryClient.setQueryData<AttributeRatingsData>(qKey, (old) => {
        if (!old) return old

        const prevUserVal = old.userValues[attribute] ?? null
        const newUserValues = { ...old.userValues, [attribute]: value }

        // Recalculate groupAvg for this attribute optimistically
        const prevGroupAvg = old.groupAvg[attribute] ?? null
        let newGroupAvg: number

        if (prevGroupAvg === null) {
          newGroupAvg = value
        } else if (prevUserVal === null) {
          // User adding new rating for this attribute
          const total = prevGroupAvg * old.count + value
          newGroupAvg = Math.round((total / (old.count + 1)) * 10) / 10
        } else {
          // User updating existing rating
          const total = prevGroupAvg * old.count - prevUserVal + value
          newGroupAvg = Math.round((total / old.count) * 10) / 10
        }

        return {
          ...old,
          userValues: newUserValues,
          groupAvg: { ...old.groupAvg, [attribute]: newGroupAvg },
        }
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
