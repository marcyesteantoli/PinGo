import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { AppError, mapSupabaseError } from '@lib/errors'
import { splitEquallyAll } from '@utils/currency'
import type { CreateExpenseFormData } from '../types'
import type { Collaborator, ExpenseWithSplits } from '@app-types/index'

function notifyExpenseAdded(expenseId: string, tripId: string, formData: CreateExpenseFormData) {
  supabase.functions.invoke('send-notification', {
    body: {
      event: 'expense_added',
      trip_id: tripId,
      source_id: expenseId,
      context: { description: formData.description, amount: formData.amount },
    },
  }).catch(() => {})
}

export function useCreateExpense(tripId: string, collaborators: Collaborator[] = [], currency = 'EUR') {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (formData: CreateExpenseFormData) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new AppError('no_session')

      const payerId = formData.payer_id ?? user.id

      const { data: expenseId, error } = await supabase.rpc('create_expense_with_splits', {
        p_trip_id: tripId,
        p_description: formData.description,
        p_amount: formData.amount,
        p_payer_id: payerId,
        p_experience_id: formData.experience_id ?? null,
        p_participant_ids: formData.participant_ids,
        p_currency: currency,
      })

      if (error) throw mapSupabaseError(error)
      return expenseId
    },
    onMutate: async (formData) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.expenses.all(tripId) })
      const snapshot = queryClient.getQueryData<ExpenseWithSplits[]>(queryKeys.expenses.all(tripId))

      const tempId = `temp_${Date.now()}`
      const payerId = formData.payer_id ?? ''
      const payerCollab = collaborators.find((c) => c.user_id === payerId)
      const splitAmounts = splitEquallyAll(formData.amount, formData.participant_ids)
      const temp: ExpenseWithSplits = {
        id: tempId,
        trip_id: tripId,
        experience_id: formData.experience_id ?? null,
        description: formData.description,
        amount: formData.amount,
        currency,
        payer_id: payerId,
        created_at: new Date().toISOString(),
        payer: { id: payerId, name: payerCollab?.name ?? 'Cargando...', avatar_url: payerCollab?.avatar_url ?? null, updated_at: '' } as any,
        splits: splitAmounts.map(({ userId, amount }) => ({
          expense_id: tempId,
          user_id: userId,
          amount,
        })),
      }

      queryClient.setQueryData<ExpenseWithSplits[]>(
        queryKeys.expenses.all(tripId),
        (old = []) => [temp, ...old]
      )

      return { snapshot }
    },
    onSuccess: (expenseId, formData) => {
      if (expenseId) notifyExpenseAdded(expenseId, tripId, formData)
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
