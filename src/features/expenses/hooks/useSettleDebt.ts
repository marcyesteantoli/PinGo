import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { maybePromptRating } from '@/hooks/useRatingPrompt'
import type { Settlement } from '@app-types/index'

interface SettleDebtParams {
  fromUserId: string
  toUserId: string
  amount: number
  settledBy: string
}

export function useSettleDebt(tripId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ fromUserId, toUserId, amount, settledBy }: SettleDebtParams) => {
      const { error } = await supabase.rpc('settle_debt_safe', {
        p_trip_id: tripId,
        p_from_user_id: fromUserId,
        p_to_user_id: toUserId,
        p_amount: amount,
        p_settled_by: settledBy,
      })
      if (error) {
        if (error.message.includes('already_settled')) throw new Error('La deuda ya está saldada o el importe supera lo que se debe.')
        if (error.message.includes('not_involved')) throw new Error('Solo el deudor o el acreedor pueden registrar el pago.')
        throw new Error(error.message)
      }
    },
    onMutate: async ({ fromUserId, toUserId, amount, settledBy }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.settlements.all(tripId) })
      const snapshot = queryClient.getQueryData<Settlement[]>(queryKeys.settlements.all(tripId))

      queryClient.setQueryData<Settlement[]>(
        queryKeys.settlements.all(tripId),
        (old = []) => [
          {
            id: `temp-settle-${Date.now()}`,
            trip_id: tripId,
            from_user_id: fromUserId,
            to_user_id: toUserId,
            amount,
            settled_by: settledBy,
            created_at: new Date().toISOString(),
          },
          ...old,
        ]
      )
      return { snapshot }
    },
    onSuccess: (_, variables) => {
      maybePromptRating()
      supabase.functions.invoke('send-notification', {
        body: {
          event: 'debt_settled',
          trip_id: tripId,
          source_id: null,
          context: { to_user_id: variables.toUserId, amount: variables.amount },
        },
      }).catch(() => {})
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
