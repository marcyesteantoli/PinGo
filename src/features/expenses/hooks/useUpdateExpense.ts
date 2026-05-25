import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { splitEqually } from '@utils/currency'
import { DEV_MODE, mockExpenses } from '@/dev/mockData'
import type { CreateExpenseFormData } from '../types'
import type { Collaborator, ExpenseWithSplits } from '@types/index'

interface UpdateExpenseArgs {
  expenseId: string
  formData: CreateExpenseFormData
}

export function useUpdateExpense(tripId: string, collaborators: Collaborator[] = []) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ expenseId, formData }: UpdateExpenseArgs) => {
      if (DEV_MODE) {
        if (mockExpenses[tripId]) {
          const idx = mockExpenses[tripId].findIndex((e) => e.id === expenseId)
          if (idx !== -1) {
            const payerId = formData.payer_id!
            const splitAmount = splitEqually(formData.amount, formData.participant_ids.length)
            mockExpenses[tripId][idx] = {
              ...mockExpenses[tripId][idx],
              description: formData.description,
              amount: formData.amount,
              payer_id: payerId,
              experience_id: formData.experience_id ?? null,
              splits: formData.participant_ids.map((uid) => ({
                expense_id: expenseId,
                user_id: uid,
                amount: splitAmount,
                is_settled: uid === payerId,
              })),
            }
          }
        }
        return
      }

      const { error: expenseError } = await supabase
        .from('expenses')
        .update({
          description: formData.description,
          amount: formData.amount,
          payer_id: formData.payer_id,
          experience_id: formData.experience_id ?? null,
        })
        .eq('id', expenseId)

      if (expenseError) throw new Error(expenseError.message)

      await supabase.from('expense_splits').delete().eq('expense_id', expenseId)

      const payerId = formData.payer_id ?? ''
      const splitAmount = splitEqually(formData.amount, formData.participant_ids.length)
      const splits = formData.participant_ids.map((uid) => ({
        expense_id: expenseId,
        user_id: uid,
        amount: splitAmount,
        is_settled: uid === payerId,
      }))

      const { error: splitsError } = await supabase.from('expense_splits').insert(splits)
      if (splitsError) throw new Error(splitsError.message)
    },
    onMutate: async ({ expenseId, formData }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.expenses.all(tripId) })
      const snapshot = queryClient.getQueryData<ExpenseWithSplits[]>(queryKeys.expenses.all(tripId))

      const payerId = formData.payer_id ?? ''
      const payerCollab = collaborators.find((c) => c.user_id === payerId)
      const splitAmount = splitEqually(formData.amount, formData.participant_ids.length)

      queryClient.setQueryData<ExpenseWithSplits[]>(
        queryKeys.expenses.all(tripId),
        (old = []) =>
          old.map((e) =>
            e.id === expenseId
              ? {
                  ...e,
                  description: formData.description,
                  amount: formData.amount,
                  payer_id: payerId,
                  experience_id: formData.experience_id ?? null,
                  payer: {
                    ...e.payer,
                    id: payerId,
                    name: payerCollab?.name ?? e.payer.name,
                    avatar_url: payerCollab?.avatar_url ?? null,
                  },
                  splits: formData.participant_ids.map((uid) => ({
                    expense_id: expenseId,
                    user_id: uid,
                    amount: splitAmount,
                    is_settled: uid === payerId,
                  })),
                }
              : e
          )
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
