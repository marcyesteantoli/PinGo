import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { DEV_MODE, mockExpenses, mockSettlements } from '@/dev/mockData'
import type { ExpenseWithSplits, Settlement } from '@app-types/index'

interface DeleteExpenseArgs {
  expenseId: string
}

export function useDeleteExpense(tripId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ expenseId }: DeleteExpenseArgs) => {
      if (DEV_MODE) {
        if (mockExpenses[tripId]) {
          mockExpenses[tripId] = mockExpenses[tripId].filter((e) => e.id !== expenseId)
        }
        // In dev mode, always clear settlements — server does smart clearing in prod.
        if (mockSettlements[tripId]) {
          mockSettlements[tripId] = []
        }
        return
      }

      const { error } = await supabase.rpc('delete_expense_safe', {
        p_expense_id: expenseId,
      })
      if (error) throw new Error(error.message)
    },
    onMutate: async ({ expenseId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.expenses.all(tripId) })
      await queryClient.cancelQueries({ queryKey: queryKeys.settlements.all(tripId) })

      const snapshotExpenses = queryClient.getQueryData<ExpenseWithSplits[]>(queryKeys.expenses.all(tripId))
      const snapshotSettlements = queryClient.getQueryData<Settlement[]>(queryKeys.settlements.all(tripId))

      queryClient.setQueryData<ExpenseWithSplits[]>(
        queryKeys.expenses.all(tripId),
        (old = []) => old.filter((e) => e.id !== expenseId)
      )

      return { snapshotExpenses, snapshotSettlements }
    },
    onError: (_, __, ctx) => {
      if (ctx?.snapshotExpenses) {
        queryClient.setQueryData(queryKeys.expenses.all(tripId), ctx.snapshotExpenses)
      }
      if (ctx?.snapshotSettlements) {
        queryClient.setQueryData(queryKeys.settlements.all(tripId), ctx.snapshotSettlements)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all(tripId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.settlements.all(tripId) })
    },
  })
}
