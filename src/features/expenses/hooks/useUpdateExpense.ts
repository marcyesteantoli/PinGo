import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { mapSupabaseError } from '@lib/errors'
import { splitEquallyAll } from '@utils/currency'
import type { CreateExpenseFormData } from '../types'
import type { Collaborator, ExpenseWithSplits } from '@app-types/index'

interface UpdateExpenseArgs {
  expenseId: string
  formData: CreateExpenseFormData
}

export function useUpdateExpense(tripId: string, collaborators: Collaborator[] = []) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ expenseId, formData }: UpdateExpenseArgs) => {
      const { error } = await supabase.rpc('update_expense_with_splits', {
        p_expense_id: expenseId,
        p_description: formData.description,
        p_amount: formData.amount,
        p_payer_id: formData.payer_id,
        p_experience_id: formData.experience_id ?? null,
        p_participant_ids: formData.participant_ids,
      })

      if (error) throw mapSupabaseError(error)
    },
    onMutate: async ({ expenseId, formData }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.expenses.all(tripId) })
      const snapshot = queryClient.getQueryData<ExpenseWithSplits[]>(queryKeys.expenses.all(tripId))

      const payerId = formData.payer_id ?? ''
      const payerCollab = collaborators.find((c) => c.user_id === payerId)
      const splitAmounts = splitEquallyAll(formData.amount, formData.participant_ids)

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
                  splits: splitAmounts.map(({ userId, amount }) => ({
                    expense_id: expenseId,
                    user_id: userId,
                    amount,
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
      // Settlements may have been auto-cleared server-side if they became invalid.
      queryClient.invalidateQueries({ queryKey: queryKeys.settlements.all(tripId) })
    },
  })
}
