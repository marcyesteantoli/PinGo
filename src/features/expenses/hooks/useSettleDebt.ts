import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { DEV_MODE, mockSettlements } from '@/dev/mockData'
import type { Settlement } from '@types/index'

interface SettleDebtParams {
  fromUserId: string
  toUserId: string
  amount: number
}

export function useSettleDebt(tripId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ fromUserId, toUserId, amount }: SettleDebtParams) => {
      if (DEV_MODE) {
        if (!mockSettlements[tripId]) mockSettlements[tripId] = []
        mockSettlements[tripId].push({
          id: `settle-${Date.now()}`,
          trip_id: tripId,
          from_user_id: fromUserId,
          to_user_id: toUserId,
          amount,
          created_at: new Date().toISOString(),
        })
        return
      }
      const { error } = await supabase
        .from('trip_settlements')
        .insert({ trip_id: tripId, from_user_id: fromUserId, to_user_id: toUserId, amount })
      if (error) throw new Error(error.message)
    },
    onMutate: async ({ fromUserId, toUserId, amount }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.settlements.all(tripId) })
      const snapshot = queryClient.getQueryData<Settlement[]>(queryKeys.settlements.all(tripId))

      queryClient.setQueryData<Settlement[]>(
        queryKeys.settlements.all(tripId),
        (old = []) => [
          ...old,
          {
            id: `temp-settle-${Date.now()}`,
            trip_id: tripId,
            from_user_id: fromUserId,
            to_user_id: toUserId,
            amount,
            created_at: new Date().toISOString(),
          },
        ]
      )
      return { snapshot }
    },
    onError: (_, __, ctx) => {
      if (ctx?.snapshot) {
        queryClient.setQueryData(queryKeys.settlements.all(tripId), ctx.snapshot)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settlements.all(tripId) })
    },
  })
}
