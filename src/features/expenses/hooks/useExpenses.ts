import { useQuery } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { DEV_MODE, mockExpenses } from '@/dev/mockData'
import type { Expense, Experience, ExpenseSplit, Profile, ExpenseWithSplits } from '@app-types/index'

type ExpenseRow = Expense & {
  expense_splits: ExpenseSplit[]
  payer: Pick<Profile, 'name' | 'avatar_url'> | null
  experience: Pick<Experience, 'type' | 'title'> | null
}

export function useExpenses(tripId: string) {
  return useQuery<ExpenseWithSplits[]>({
    queryKey: queryKeys.expenses.all(tripId),
    queryFn: async () => {
      if (DEV_MODE) return [...(mockExpenses[tripId] ?? [])]
      const { data, error } = await supabase
        .from('expenses')
        .select('*, expense_splits(*), payer:profiles!payer_id(name, avatar_url), experience:experiences(type, title)')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false })

      if (error) throw new Error(error.message)

      return (data ?? [] as ExpenseRow[]).map((e) => ({
        ...e,
        splits: e.expense_splits ?? [],
        payer: e.payer ?? { name: 'Desconocido', avatar_url: null },
        experience: e.experience ?? null,
      })) as ExpenseWithSplits[]
    },
    staleTime: 0,
  })
}
