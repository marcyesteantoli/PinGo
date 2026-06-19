import React from 'react'
import { waitFor } from '@testing-library/react-native'
import { renderHook } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { useUpdateExpense } from '../useUpdateExpense'
import { queryKeys } from '@lib/queryKeys'
import { splitEquallyAll } from '@utils/currency'
import type { Collaborator, ExpenseWithSplits } from '@app-types/index'

beforeEach(() => jest.clearAllMocks())

const TRIP_ID = 'trip-001'
const EXPENSE_ID = 'expense-abc'

const COLLABORATORS: Collaborator[] = [
  {
    user_id: 'user-alice',
    name: 'Alice',
    avatar_url: 'https://example.com/alice.png',
    role: 'owner',
    status: 'active',
    joined_at: '2025-01-01T00:00:00Z',
  },
  {
    user_id: 'user-bob',
    name: 'Bob',
    avatar_url: null,
    role: 'member',
    status: 'active',
    joined_at: '2025-01-01T00:00:00Z',
  },
]

function makeExpense(overrides: Partial<ExpenseWithSplits> = {}): ExpenseWithSplits {
  return {
    id: EXPENSE_ID,
    trip_id: TRIP_ID,
    experience_id: null,
    description: 'Old description',
    amount: 50,
    currency: 'EUR',
    payer_id: 'user-alice',
    created_at: '2025-01-01T00:00:00Z',
    payer: { id: 'user-alice', name: 'Alice', avatar_url: null, updated_at: '' } as any,
    splits: [
      { expense_id: EXPENSE_ID, user_id: 'user-alice', amount: 25 },
      { expense_id: EXPENSE_ID, user_id: 'user-bob', amount: 25 },
    ],
    ...overrides,
  }
}

const FORM_DATA = {
  description: 'Updated dinner',
  amount: 60,
  payer_id: 'user-bob',
  participant_ids: ['user-alice', 'user-bob'],
  experience_id: null as string | null,
}

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

describe('useUpdateExpense', () => {
  it('calls supabase.rpc with correct parameters', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({ data: null, error: null })

    const { wrapper } = createTestContext()
    const { result } = await renderHook(
      () => useUpdateExpense(TRIP_ID, COLLABORATORS),
      { wrapper },
    )

    result.current.mutate({ expenseId: EXPENSE_ID, formData: FORM_DATA })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.rpc).toHaveBeenCalledWith('update_expense_with_splits', {
      p_expense_id: EXPENSE_ID,
      p_description: 'Updated dinner',
      p_amount: 60,
      p_payer_id: 'user-bob',
      p_experience_id: null,
      p_participant_ids: ['user-alice', 'user-bob'],
    })
  })

  it('onMutate: updates expense description and amount in cache', async () => {
    let resolveRpc!: (val: any) => void
    ;(supabase.rpc as jest.Mock).mockReturnValue(
      new Promise((res) => { resolveRpc = res })
    )

    const { queryClient, wrapper } = createTestContext()
    queryClient.setQueryData(queryKeys.expenses.all(TRIP_ID), [makeExpense()])

    const { result } = await renderHook(
      () => useUpdateExpense(TRIP_ID, COLLABORATORS),
      { wrapper },
    )

    result.current.mutate({ expenseId: EXPENSE_ID, formData: FORM_DATA })

    await waitFor(() => {
      const cached = queryClient.getQueryData<ExpenseWithSplits[]>(queryKeys.expenses.all(TRIP_ID))
      return cached?.[0]?.description === 'Updated dinner'
    })

    const cached = queryClient.getQueryData<ExpenseWithSplits[]>(queryKeys.expenses.all(TRIP_ID))!
    expect(cached[0].description).toBe('Updated dinner')
    expect(cached[0].amount).toBe(60)

    resolveRpc({ data: null, error: null })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('onMutate: recalculates splits using splitEquallyAll', async () => {
    let resolveRpc!: (val: any) => void
    ;(supabase.rpc as jest.Mock).mockReturnValue(
      new Promise((res) => { resolveRpc = res })
    )

    const { queryClient, wrapper } = createTestContext()
    queryClient.setQueryData(queryKeys.expenses.all(TRIP_ID), [makeExpense()])

    const { result } = await renderHook(
      () => useUpdateExpense(TRIP_ID, COLLABORATORS),
      { wrapper },
    )

    result.current.mutate({ expenseId: EXPENSE_ID, formData: FORM_DATA })

    await waitFor(() => {
      const cached = queryClient.getQueryData<ExpenseWithSplits[]>(queryKeys.expenses.all(TRIP_ID))
      return cached?.[0]?.amount === 60
    })

    const cached = queryClient.getQueryData<ExpenseWithSplits[]>(queryKeys.expenses.all(TRIP_ID))!
    const expected = splitEquallyAll(60, ['user-alice', 'user-bob'])

    expect(cached[0].splits).toHaveLength(2)
    expect(cached[0].splits[0].user_id).toBe(expected[0].userId)
    expect(cached[0].splits[0].amount).toBe(expected[0].amount)
    expect(cached[0].splits[1].user_id).toBe(expected[1].userId)
    expect(cached[0].splits[1].amount).toBe(expected[1].amount)
    // All splits reference correct expense_id
    cached[0].splits.forEach((s) => expect(s.expense_id).toBe(EXPENSE_ID))
    // Splits sum exactly to total
    const total = cached[0].splits.reduce((sum, s) => sum + s.amount, 0)
    expect(total).toBeCloseTo(60, 5)

    resolveRpc({ data: null, error: null })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('onMutate: updates payer name and avatar from collaborators array', async () => {
    let resolveRpc!: (val: any) => void
    ;(supabase.rpc as jest.Mock).mockReturnValue(
      new Promise((res) => { resolveRpc = res })
    )

    const { queryClient, wrapper } = createTestContext()
    queryClient.setQueryData(queryKeys.expenses.all(TRIP_ID), [makeExpense()])

    const { result } = await renderHook(
      () => useUpdateExpense(TRIP_ID, COLLABORATORS),
      { wrapper },
    )

    // Switch payer to Bob
    result.current.mutate({ expenseId: EXPENSE_ID, formData: { ...FORM_DATA, payer_id: 'user-bob' } })

    await waitFor(() => {
      const cached = queryClient.getQueryData<ExpenseWithSplits[]>(queryKeys.expenses.all(TRIP_ID))
      return cached?.[0]?.payer?.name === 'Bob'
    })

    const cached = queryClient.getQueryData<ExpenseWithSplits[]>(queryKeys.expenses.all(TRIP_ID))!
    expect(cached[0].payer.name).toBe('Bob')
    expect(cached[0].payer.id).toBe('user-bob')
    expect(cached[0].payer.avatar_url).toBeNull()

    resolveRpc({ data: null, error: null })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('onMutate: uses alice avatar when payer is alice', async () => {
    let resolveRpc!: (val: any) => void
    ;(supabase.rpc as jest.Mock).mockReturnValue(
      new Promise((res) => { resolveRpc = res })
    )

    const { queryClient, wrapper } = createTestContext()
    queryClient.setQueryData(queryKeys.expenses.all(TRIP_ID), [makeExpense()])

    const { result } = await renderHook(
      () => useUpdateExpense(TRIP_ID, COLLABORATORS),
      { wrapper },
    )

    // Keep payer as Alice (has avatar_url)
    result.current.mutate({ expenseId: EXPENSE_ID, formData: { ...FORM_DATA, payer_id: 'user-alice' } })

    await waitFor(() => {
      const cached = queryClient.getQueryData<ExpenseWithSplits[]>(queryKeys.expenses.all(TRIP_ID))
      return cached?.[0]?.payer?.name === 'Alice'
    })

    const cached = queryClient.getQueryData<ExpenseWithSplits[]>(queryKeys.expenses.all(TRIP_ID))!
    expect(cached[0].payer.avatar_url).toBe('https://example.com/alice.png')

    resolveRpc({ data: null, error: null })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('onError: restores snapshot when rpc fails', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({
      data: null,
      error: { message: 'DB error' },
    })

    const { queryClient, wrapper } = createTestContext()
    const original = makeExpense()
    queryClient.setQueryData(queryKeys.expenses.all(TRIP_ID), [original])

    const { result } = await renderHook(
      () => useUpdateExpense(TRIP_ID, COLLABORATORS),
      { wrapper },
    )

    result.current.mutate({ expenseId: EXPENSE_ID, formData: FORM_DATA })

    await waitFor(() => expect(result.current.isError).toBe(true))

    const cached = queryClient.getQueryData<ExpenseWithSplits[]>(queryKeys.expenses.all(TRIP_ID))!
    expect(cached).toHaveLength(1)
    expect(cached[0].description).toBe('Old description')
    expect(cached[0].amount).toBe(50)
  })

  it('onSettled: invalidates both expenses and settlements queries', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({ data: null, error: null })

    const { queryClient, wrapper } = createTestContext()
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')

    const { result } = await renderHook(
      () => useUpdateExpense(TRIP_ID, COLLABORATORS),
      { wrapper },
    )

    result.current.mutate({ expenseId: EXPENSE_ID, formData: FORM_DATA })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.expenses.all(TRIP_ID),
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.settlements.all(TRIP_ID),
    })
  })
})
