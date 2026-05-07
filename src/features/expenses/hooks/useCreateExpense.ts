import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { splitEqually } from '@utils/currency'
import type { CreateExpenseFormData } from '../types'

export function useCreateExpense(tripId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (formData: CreateExpenseFormData) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No hay sesión activa')

      const { data: expense, error: expenseError } = await supabase
        .from('expenses')
        .insert({
          trip_id: tripId,
          description: formData.description,
          amount: formData.amount,
          payer_id: user.id,
          experience_id: formData.experience_id ?? null,
        })
        .select()
        .single()

      if (expenseError) throw new Error(expenseError.message)

      const splitAmount = splitEqually(formData.amount, formData.participant_ids.length)
      const splits = formData.participant_ids.map((uid) => ({
        expense_id: expense.id,
        user_id: uid,
        amount: splitAmount,
      }))

      const { error: splitsError } = await supabase.from('expense_splits').insert(splits)

      if (splitsError) {
        await supabase.from('expenses').delete().eq('id', expense.id)
        throw new Error(splitsError.message)
      }

      return expense
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all(tripId) })
    },
  })
}
