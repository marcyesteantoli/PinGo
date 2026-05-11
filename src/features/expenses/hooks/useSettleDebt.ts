import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { DEV_MODE, DEMO_USER_ID, mockExpenses } from '@/dev/mockData'
import type { ExpenseWithSplits } from '@types/index'

interface SettleDebtParams {
  fromUserId: string // the one who owes
  toUserId: string   // the one who is owed (creditor/payer)
}

// Settles all expense splits where fromUser owes toUser across the entire trip
export function useSettleDebt(tripId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ fromUserId, toUserId }: SettleDebtParams) => {
      if (DEV_MODE) {
        const trip = mockExpenses[tripId]
        if (trip) {
          for (const expense of trip) {
            if (expense.payer_id !== toUserId) continue
            expense.splits = expense.splits.map((s) =>
              s.user_id === fromUserId ? { ...s, is_settled: true } : s
            )
          }
        }
        return
      }

      // Get all expenses in this trip paid by toUserId
      const { data: expenseIds, error: fetchError } = await supabase
        .from('expenses')
        .select('id')
        .eq('trip_id', tripId)
        .eq('payer_id', toUserId)

      if (fetchError) throw new Error(fetchError.message)
      if (!expenseIds?.length) return

      const ids = expenseIds.map((e) => e.id)

      const { error } = await supabase
        .from('expense_splits')
        .update({ is_settled: true })
        .in('expense_id', ids)
        .eq('user_id', fromUserId)
        .eq('is_settled', false)

      if (error) throw new Error(error.message)
    },
    onMutate: async ({ fromUserId, toUserId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.expenses.all(tripId) })
      const snapshot = queryClient.getQueryData<ExpenseWithSplits[]>(queryKeys.expenses.all(tripId))

      queryClient.setQueryData<ExpenseWithSplits[]>(
        queryKeys.expenses.all(tripId),
        (old = []) =>
          old.map((expense) => {
            if (expense.payer_id !== toUserId) return expense
            return {
              ...expense,
              splits: expense.splits.map((s) =>
                s.user_id === fromUserId ? { ...s, is_settled: true } : s
              ),
            }
          })
      )

      return { snapshot }
    },
    onError: (_, __, ctx) => {
      if (ctx?.snapshot) {
        queryClient.setQueryData(queryKeys.expenses.all(tripId), ctx.snapshot)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all(tripId) })
    },
  })
}
