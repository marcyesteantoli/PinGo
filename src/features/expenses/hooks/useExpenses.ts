import { useQuery } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { DEV_MODE, mockExpenses } from '@/dev/mockData'
import type { Expense, ExpenseSplit, Profile, ExpenseWithSplits } from '@types/index'

type ExpenseRow = Expense & {
  expense_splits: ExpenseSplit[]
  payer: Pick<Profile, 'name' | 'avatar_url'> | null
}

export function useExpenses(tripId: string) {
  return useQuery<ExpenseWithSplits[]>({
    queryKey: queryKeys.expenses.all(tripId),
    queryFn: async () => {
      if (DEV_MODE) return [...(mockExpenses[tripId] ?? [])]
      const { data, error } = await supabase
        .from('expenses')
        .select('*, expense_splits(*), payer:profiles!payer_id(name, avatar_url)')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false })

      if (error) throw new Error(error.message)

      return (data ?? [] as ExpenseRow[]).map((e) => ({
        ...e,
        splits: e.expense_splits ?? [],
        payer: e.payer ?? { name: 'Desconocido', avatar_url: null },
      })) as ExpenseWithSplits[]
    },
    staleTime: 0,
  })
}
