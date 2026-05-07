import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { DEV_MODE, DEMO_USER_ID, mockExpenses } from '@/dev/mockData'
import type { ExpenseWithSplits } from '@types/index'

export function useSettleExpense(tripId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (expenseId: string) => {
      if (DEV_MODE) {
        const trip = mockExpenses[tripId]
        if (trip) {
          const expense = trip.find((e) => e.id === expenseId)
          if (expense) {
            expense.splits = expense.splits.map((s) =>
              s.user_id === DEMO_USER_ID ? { ...s, is_settled: true } : s
            )
          }
        }
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No hay sesión activa')

      const { error } = await supabase
        .from('expense_splits')
        .update({ is_settled: true })
        .eq('expense_id', expenseId)
        .eq('user_id', user.id)

      if (error) throw new Error(error.message)
    },
    onSuccess: (_, expenseId) => {
      if (DEV_MODE) {
        queryClient.setQueryData<ExpenseWithSplits[]>(
          queryKeys.expenses.all(tripId),
          (old = []) => old.map((e) =>
            e.id === expenseId
              ? { ...e, splits: e.splits.map((s) => s.user_id === DEMO_USER_ID ? { ...s, is_settled: true } : s) }
              : e
          )
        )
        return
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all(tripId) })
    },
  })
}
