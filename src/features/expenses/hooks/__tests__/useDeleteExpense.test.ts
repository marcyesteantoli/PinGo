import React from 'react'
import { renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { useDeleteExpense } from '../useDeleteExpense'
import { queryKeys } from '@lib/queryKeys'
import type { ExpenseWithSplits, Settlement } from '@app-types/index'

beforeEach(() => jest.clearAllMocks())

const TRIP_ID = 'trip-delete-001'

function createTestContext() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
  return { queryClient, wrapper }
}

function makeExpense(id: string): ExpenseWithSplits {
  return {
    id,
    trip_id: TRIP_ID,
    experience_id: null,
    description: `Expense ${id}`,
    amount: 20,
    currency: 'EUR',
    payer_id: 'user-a',
    created_at: '2025-01-01T00:00:00Z',
    payer: { id: 'user-a', name: 'Alice', avatar_url: null, updated_at: '' } as any,
    splits: [],
  }
}

function makeSettlement(id: string): Settlement {
  return {
    id,
    trip_id: TRIP_ID,
    from_user_id: 'user-b',
    to_user_id: 'user-a',
    amount: 10,
    settled_by: 'user-a',
    created_at: '2025-01-01T00:00:00Z',
  } as any
}

describe('useDeleteExpense', () => {
  it('calls supabase.rpc delete_expense_safe with the correct expense_id', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({ error: null })

    const { wrapper } = createTestContext()
    const { result } = await renderHook(() => useDeleteExpense(TRIP_ID), { wrapper })

    result.current.mutate({ expenseId: 'expense-123' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.rpc).toHaveBeenCalledWith('delete_expense_safe', {
      p_expense_id: 'expense-123',
    })
  })

  it('onMutate removes the deleted expense from the expenses cache immediately (optimistic)', async () => {
    // Delay rpc so we can inspect cache while in-flight
    let resolveRpc!: (val: any) => void
    ;(supabase.rpc as jest.Mock).mockReturnValue(
      new Promise((res) => { resolveRpc = res })
    )

    const { queryClient, wrapper } = createTestContext()
    const expense1 = makeExpense('expense-to-delete')
    const expense2 = makeExpense('expense-keep')
    queryClient.setQueryData(queryKeys.expenses.all(TRIP_ID), [expense1, expense2])

    const { result } = await renderHook(() => useDeleteExpense(TRIP_ID), { wrapper })

    result.current.mutate({ expenseId: 'expense-to-delete' })

    await waitFor(() => {
      const cached = queryClient.getQueryData<ExpenseWithSplits[]>(queryKeys.expenses.all(TRIP_ID))
      return Array.isArray(cached) && cached.length === 1
    })

    const cached = queryClient.getQueryData<ExpenseWithSplits[]>(queryKeys.expenses.all(TRIP_ID))!
    expect(cached).toHaveLength(1)
    expect(cached[0].id).toBe('expense-keep')

    resolveRpc({ error: null })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('onMutate saves a snapshot of expenses — restored after error', async () => {
    let resolveRpc!: (val: any) => void
    ;(supabase.rpc as jest.Mock).mockReturnValue(
      new Promise((res) => { resolveRpc = res })
    )

    const { queryClient, wrapper } = createTestContext()
    const expense1 = makeExpense('expense-snap-1')
    const expense2 = makeExpense('expense-snap-2')
    queryClient.setQueryData(queryKeys.expenses.all(TRIP_ID), [expense1, expense2])
    queryClient.setQueryData(queryKeys.settlements.all(TRIP_ID), [makeSettlement('s-1')])

    const { result } = await renderHook(() => useDeleteExpense(TRIP_ID), { wrapper })

    result.current.mutate({ expenseId: 'expense-snap-1' })

    // After onMutate, cache has 1 item (optimistic remove)
    await waitFor(() => {
      const cached = queryClient.getQueryData<ExpenseWithSplits[]>(queryKeys.expenses.all(TRIP_ID))
      return Array.isArray(cached) && cached.length === 1
    })

    // Resolve with error to trigger rollback
    resolveRpc({ error: { message: 'DB error' } })
    await waitFor(() => expect(result.current.isError).toBe(true))

    // Snapshot must be restored — both expenses back in cache
    const restored = queryClient.getQueryData<ExpenseWithSplits[]>(queryKeys.expenses.all(TRIP_ID))!
    expect(restored).toHaveLength(2)
    expect(restored.map((e) => e.id)).toContain('expense-snap-1')
    expect(restored.map((e) => e.id)).toContain('expense-snap-2')
  })

  it('onMutate saves a snapshot of settlements — restored after error', async () => {
    let resolveRpc!: (val: any) => void
    ;(supabase.rpc as jest.Mock).mockReturnValue(
      new Promise((res) => { resolveRpc = res })
    )

    const { queryClient, wrapper } = createTestContext()
    const settlement = makeSettlement('s-original')
    queryClient.setQueryData(queryKeys.expenses.all(TRIP_ID), [makeExpense('e-1')])
    queryClient.setQueryData(queryKeys.settlements.all(TRIP_ID), [settlement])

    const { result } = await renderHook(() => useDeleteExpense(TRIP_ID), { wrapper })

    result.current.mutate({ expenseId: 'e-1' })

    await waitFor(() => {
      const cached = queryClient.getQueryData<ExpenseWithSplits[]>(queryKeys.expenses.all(TRIP_ID))
      return Array.isArray(cached) && cached.length === 0
    })

    // Trigger error → settlements snapshot must be restored
    resolveRpc({ error: { message: 'fail' } })
    await waitFor(() => expect(result.current.isError).toBe(true))

    const restoredSettlements = queryClient.getQueryData<Settlement[]>(queryKeys.settlements.all(TRIP_ID))!
    expect(restoredSettlements).toHaveLength(1)
    expect(restoredSettlements[0].id).toBe('s-original')
  })

  it('onError restores both expenses and settlements snapshots', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({ error: { message: 'server error' } })

    const { queryClient, wrapper } = createTestContext()
    queryClient.setQueryData(queryKeys.expenses.all(TRIP_ID), [makeExpense('e-A'), makeExpense('e-B')])
    queryClient.setQueryData(queryKeys.settlements.all(TRIP_ID), [makeSettlement('s-A')])

    const { result } = await renderHook(() => useDeleteExpense(TRIP_ID), { wrapper })

    result.current.mutate({ expenseId: 'e-A' })

    await waitFor(() => expect(result.current.isError).toBe(true))

    const expenses = queryClient.getQueryData<ExpenseWithSplits[]>(queryKeys.expenses.all(TRIP_ID))!
    const settlements = queryClient.getQueryData<Settlement[]>(queryKeys.settlements.all(TRIP_ID))!

    expect(expenses).toHaveLength(2)
    expect(settlements).toHaveLength(1)
  })

  it('onSettled invalidates both expenses and settlements queries', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({ error: null })

    const { queryClient, wrapper } = createTestContext()
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')

    const { result } = await renderHook(() => useDeleteExpense(TRIP_ID), { wrapper })

    result.current.mutate({ expenseId: 'e-123' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.expenses.all(TRIP_ID),
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.settlements.all(TRIP_ID),
    })
  })
})
