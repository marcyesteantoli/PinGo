import { useQuery } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { DEV_MODE, mockExpenses } from '@/dev/mockData'
import type { ExpenseWithSplits } from '@types/index'

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

      return (data ?? []).map((e: any) => ({
        ...e,
        splits: e.expense_splits ?? [],
        payer: e.payer ?? { name: 'Desconocido', avatar_url: null },
      })) as ExpenseWithSplits[]
    },
    staleTime: 0,
  })
}
