import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { splitEqually } from '@utils/currency'
import { DEV_MODE, DEMO_USER_ID, mockExpenses } from '@/dev/mockData'
import type { CreateExpenseFormData } from '../types'
import type { Collaborator, ExpenseWithSplits } from '@types/index'

export function useCreateExpense(tripId: string, collaborators: Collaborator[] = []) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (formData: CreateExpenseFormData) => {
      if (DEV_MODE) {
        const payerId = formData.payer_id ?? DEMO_USER_ID
        const payerCollab = collaborators.find((c) => c.user_id === payerId)
        const id = `demo-gasto-${Date.now()}`
        const splitAmount = splitEqually(formData.amount, formData.participant_ids.length)
        const newExpense: ExpenseWithSplits = {
          id,
          trip_id: tripId,
          experience_id: formData.experience_id ?? null,
          description: formData.description,
          amount: formData.amount,
          currency: 'EUR',
          payer_id: payerId,
          created_at: new Date().toISOString(),
          payer: { id: payerId, name: payerCollab?.name ?? 'Usuario Demo', avatar_url: payerCollab?.avatar_url ?? null, updated_at: '' } as any,
          splits: formData.participant_ids.map((uid) => ({
            expense_id: id,
            user_id: uid,
            amount: splitAmount,
            is_settled: uid === payerId, // payer's own split settled immediately
          })),
        }
        if (!mockExpenses[tripId]) mockExpenses[tripId] = []
        mockExpenses[tripId].unshift(newExpense)
        return newExpense
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No hay sesión activa')

      const payerId = formData.payer_id ?? user.id

      const { data: expense, error: expenseError } = await supabase
        .from('expenses')
        .insert({
          trip_id: tripId,
          description: formData.description,
          amount: formData.amount,
          payer_id: payerId,
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
        is_settled: uid === payerId, // payer's own split is settled by default
      }))

      const { error: splitsError } = await supabase.from('expense_splits').insert(splits)

      if (splitsError) {
        await supabase.from('expenses').delete().eq('id', expense.id)
        throw new Error(splitsError.message)
      }

      return expense
    },
    onMutate: async (formData) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.expenses.all(tripId) })
      const snapshot = queryClient.getQueryData<ExpenseWithSplits[]>(queryKeys.expenses.all(tripId))

      const tempId = `temp_${Date.now()}`
      const payerId = formData.payer_id ?? DEMO_USER_ID
      const payerCollab = collaborators.find((c) => c.user_id === payerId)
      const splitAmount = splitEqually(formData.amount, formData.participant_ids.length)
      const temp: ExpenseWithSplits = {
        id: tempId,
        trip_id: tripId,
        experience_id: formData.experience_id ?? null,
        description: formData.description,
        amount: formData.amount,
        currency: 'EUR',
        payer_id: payerId,
        created_at: new Date().toISOString(),
        payer: { id: payerId, name: payerCollab?.name ?? 'Cargando...', avatar_url: payerCollab?.avatar_url ?? null, updated_at: '' } as any,
        splits: formData.participant_ids.map((uid) => ({
          expense_id: tempId,
          user_id: uid,
          amount: splitAmount,
          is_settled: uid === payerId,
        })),
      }

      queryClient.setQueryData<ExpenseWithSplits[]>(
        queryKeys.expenses.all(tripId),
        (old = []) => [temp, ...old]
      )

      return { snapshot }
    },
    onError: (_, __, ctx) => {
      if (ctx?.snapshot) {
        queryClient.setQueryData(queryKeys.expenses.all(tripId), ctx.snapshot)
      }
    },
    onSuccess: (newExpense) => {
      queryClient.setQueryData<ExpenseWithSplits[]>(
        queryKeys.expenses.all(tripId),
        (old = []) => {
          const withoutTemp = old.filter((e) => !e.id.startsWith('temp_'))
          return [newExpense as ExpenseWithSplits, ...withoutTemp]
        }
      )
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all(tripId) })
    },
  })
}
