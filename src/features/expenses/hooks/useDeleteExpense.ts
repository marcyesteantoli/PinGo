import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { DEV_MODE, mockExpenses } from '@/dev/mockData'
import type { ExpenseWithSplits } from '@types/index'

export function useDeleteExpense(tripId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (expenseId: string) => {
      if (DEV_MODE) {
        if (mockExpenses[tripId]) {
          mockExpenses[tripId] = mockExpenses[tripId].filter((e) => e.id !== expenseId)
        }
        return
      }
      await supabase.from('expense_splits').delete().eq('expense_id', expenseId)
      const { error } = await supabase.from('expenses').delete().eq('id', expenseId)
      if (error) throw new Error(error.message)
    },
    onMutate: async (expenseId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.expenses.all(tripId) })
      const snapshot = queryClient.getQueryData<ExpenseWithSplits[]>(queryKeys.expenses.all(tripId))
      queryClient.setQueryData<ExpenseWithSplits[]>(
        queryKeys.expenses.all(tripId),
        (old = []) => old.filter((e) => e.id !== expenseId)
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
