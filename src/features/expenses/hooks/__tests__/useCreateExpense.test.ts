import React from 'react'
import { waitFor } from '@testing-library/react-native'
import { renderHook } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { useCreateExpense } from '../useCreateExpense'
import { queryKeys } from '@lib/queryKeys'
import type { Collaborator, ExpenseWithSplits } from '@app-types/index'

beforeEach(() => jest.clearAllMocks())

const TRIP_ID = 'trip-001'
const MOCK_USER = { id: 'user-payer', email: 'payer@example.com' }

const COLLABORATORS: Collaborator[] = [
  {
    user_id: 'user-payer',
    name: 'Alice',
    avatar_url: null,
    role: 'owner',
    status: 'active',
    joined_at: '2025-01-01T00:00:00Z',
  },
  {
    user_id: 'user-b',
    name: 'Bob',
    avatar_url: null,
    role: 'member',
    status: 'active',
    joined_at: '2025-01-01T00:00:00Z',
  },
]

function makeExistingExpense(id = 'expense-existing'): ExpenseWithSplits {
  return {
    id,
    trip_id: TRIP_ID,
    experience_id: null,
    description: 'Existing expense',
    amount: 50,
    currency: 'EUR',
    payer_id: 'user-payer',
    created_at: '2025-01-01T00:00:00Z',
    payer: { id: 'user-payer', name: 'Alice', avatar_url: null, updated_at: '' } as any,
    splits: [
      { expense_id: id, user_id: 'user-payer', amount: 25 },
      { expense_id: id, user_id: 'user-b', amount: 25 },
    ],
  }
}

const FORM_DATA = {
  description: 'Dinner',
  amount: 30,
  participant_ids: ['user-payer', 'user-b'],
  payer_id: 'user-payer',
}

// Returns a { queryClient, wrapper } pair so tests can inspect/seed the cache directly
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

describe('useCreateExpense', () => {
  it('calls supabase.rpc with correct parameters', async () => {
    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: MOCK_USER },
      error: null,
    })
    ;(supabase.rpc as jest.Mock).mockResolvedValue({ data: 'new-expense-id', error: null })

    const { wrapper } = createTestContext()
    const { result } = await renderHook(
      () => useCreateExpense(TRIP_ID, COLLABORATORS),
      { wrapper },
    )

    result.current.mutate(FORM_DATA)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.rpc).toHaveBeenCalledWith('create_expense_with_splits', {
      p_trip_id: TRIP_ID,
      p_description: 'Dinner',
      p_amount: 30,
      p_payer_id: 'user-payer',
      p_experience_id: null,
      p_participant_ids: ['user-payer', 'user-b'],
      p_currency: 'EUR',
    })
  })

  it('optimistic update adds temp expense to cache before server resolves', async () => {
    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: MOCK_USER },
      error: null,
    })
    // Delay the rpc so we can inspect the cache while mutation is in-flight
    let resolveRpc!: (val: any) => void
    ;(supabase.rpc as jest.Mock).mockReturnValue(
      new Promise((res) => { resolveRpc = res })
    )

    const { queryClient, wrapper } = createTestContext()
    const existing = makeExistingExpense()
    queryClient.setQueryData(queryKeys.expenses.all(TRIP_ID), [existing])

    const { result } = await renderHook(
      () => useCreateExpense(TRIP_ID, COLLABORATORS),
      { wrapper },
    )

    result.current.mutate(FORM_DATA)

    // Wait for onMutate to run (cache should now have temp item prepended)
    await waitFor(() => {
      const cached = queryClient.getQueryData<ExpenseWithSplits[]>(queryKeys.expenses.all(TRIP_ID))
      return !!cached && cached.length === 2
    })

    const cached = queryClient.getQueryData<ExpenseWithSplits[]>(queryKeys.expenses.all(TRIP_ID))!
    expect(cached).toHaveLength(2)
    // Temp item is prepended at index 0
    expect(cached[0].id).toMatch(/^temp_/)
    expect(cached[0].description).toBe('Dinner')
    expect(cached[0].amount).toBe(30)
    // Original item is still present
    expect(cached[1].id).toBe('expense-existing')

    // Resolve to let the mutation finish and avoid open handles
    resolveRpc({ data: 'new-id', error: null })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('rolls back cache to snapshot when supabase.rpc fails', async () => {
    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: MOCK_USER },
      error: null,
    })
    ;(supabase.rpc as jest.Mock).mockResolvedValue({
      data: null,
      error: { message: 'DB constraint violation' },
    })

    const { queryClient, wrapper } = createTestContext()
    const existing = makeExistingExpense()
    queryClient.setQueryData(queryKeys.expenses.all(TRIP_ID), [existing])

    const { result } = await renderHook(
      () => useCreateExpense(TRIP_ID, COLLABORATORS),
      { wrapper },
    )

    result.current.mutate(FORM_DATA)

    await waitFor(() => expect(result.current.isError).toBe(true))

    // Cache must have been rolled back to the original single item
    const cached = queryClient.getQueryData<ExpenseWithSplits[]>(queryKeys.expenses.all(TRIP_ID))
    expect(cached).toHaveLength(1)
    expect(cached![0].id).toBe('expense-existing')
  })

  it('invalidates expenses query on settled after success', async () => {
    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: MOCK_USER },
      error: null,
    })
    ;(supabase.rpc as jest.Mock).mockResolvedValue({ data: 'new-id', error: null })

    const { queryClient, wrapper } = createTestContext()
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')

    const { result } = await renderHook(
      () => useCreateExpense(TRIP_ID, COLLABORATORS),
      { wrapper },
    )

    result.current.mutate(FORM_DATA)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.expenses.all(TRIP_ID),
    })
  })

  it('optimistic split amounts sum to the total expense amount', async () => {
    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: MOCK_USER },
      error: null,
    })
    let resolveRpc!: (val: any) => void
    ;(supabase.rpc as jest.Mock).mockReturnValue(
      new Promise((res) => { resolveRpc = res })
    )

    const { queryClient, wrapper } = createTestContext()

    const { result } = await renderHook(
      () => useCreateExpense(TRIP_ID, COLLABORATORS),
      { wrapper },
    )

    result.current.mutate(FORM_DATA)

    await waitFor(() => {
      const cached = queryClient.getQueryData<ExpenseWithSplits[]>(queryKeys.expenses.all(TRIP_ID))
      return !!cached && cached.length > 0
    })

    const cached = queryClient.getQueryData<ExpenseWithSplits[]>(queryKeys.expenses.all(TRIP_ID))!
    const tempExpense = cached[0]

    // 30 EUR / 2 participants = 15 each
    expect(tempExpense.splits).toHaveLength(2)
    const total = tempExpense.splits.reduce((sum, s) => sum + s.amount, 0)
    expect(total).toBeCloseTo(30, 5)

    resolveRpc({ data: 'new-id', error: null })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})
