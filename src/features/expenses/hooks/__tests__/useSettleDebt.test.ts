import React from 'react'
import { renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { useSettleDebt } from '../useSettleDebt'
import { queryKeys } from '@lib/queryKeys'
import type { Settlement } from '@app-types/index'

beforeEach(() => jest.clearAllMocks())

const TRIP_ID = 'trip-settle-001'

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

const SETTLE_PARAMS = {
  fromUserId: 'user-b',
  toUserId: 'user-a',
  amount: 15,
  settledBy: 'user-a',
}

describe('useSettleDebt', () => {
  it('calls supabase.rpc settle_debt_safe with correct parameters', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({ error: null })

    const { wrapper } = createTestContext()
    const { result } = await renderHook(() => useSettleDebt(TRIP_ID), { wrapper })

    result.current.mutate(SETTLE_PARAMS)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.rpc).toHaveBeenCalledWith('settle_debt_safe', {
      p_trip_id: TRIP_ID,
      p_from_user_id: 'user-b',
      p_to_user_id: 'user-a',
      p_amount: 15,
      p_settled_by: 'user-a',
    })
  })

  it('onMutate adds a temporary settlement with id starting with temp-settle-', async () => {
    let resolveRpc!: (val: any) => void
    ;(supabase.rpc as jest.Mock).mockReturnValue(
      new Promise((res) => { resolveRpc = res })
    )

    const { queryClient, wrapper } = createTestContext()
    queryClient.setQueryData(queryKeys.settlements.all(TRIP_ID), [makeSettlement('s-existing')])

    const { result } = await renderHook(() => useSettleDebt(TRIP_ID), { wrapper })

    result.current.mutate(SETTLE_PARAMS)

    // Wait until onMutate runs and prepends temp settlement
    await waitFor(() => {
      const cached = queryClient.getQueryData<Settlement[]>(queryKeys.settlements.all(TRIP_ID))
      return Array.isArray(cached) && cached.length === 2
    })

    const cached = queryClient.getQueryData<Settlement[]>(queryKeys.settlements.all(TRIP_ID))!
    // Temp settlement is prepended at index 0
    expect(cached[0].id).toMatch(/^temp-settle-/)
    expect(cached[0].from_user_id).toBe('user-b')
    expect(cached[0].to_user_id).toBe('user-a')
    expect(cached[0].amount).toBe(15)
    // Original still present
    expect(cached[1].id).toBe('s-existing')

    resolveRpc({ error: null })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('already_settled error → throws with the correct message', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({
      error: { message: 'already_settled: debt already cleared' },
    })

    const { wrapper } = createTestContext()
    const { result } = await renderHook(() => useSettleDebt(TRIP_ID), { wrapper })

    result.current.mutate(SETTLE_PARAMS)

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error?.message).toBe(
      'La deuda ya está saldada o el importe supera lo que se debe.'
    )
  })

  it('not_involved error → throws with the correct message', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({
      error: { message: 'not_involved: user not part of this debt' },
    })

    const { wrapper } = createTestContext()
    const { result } = await renderHook(() => useSettleDebt(TRIP_ID), { wrapper })

    result.current.mutate(SETTLE_PARAMS)

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error?.message).toBe(
      'Solo el deudor o el acreedor pueden registrar el pago.'
    )
  })

  it('onError restores settlements snapshot', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({
      error: { message: 'already_settled' },
    })

    const { queryClient, wrapper } = createTestContext()
    const existingSettlement = makeSettlement('s-restore')
    queryClient.setQueryData(queryKeys.settlements.all(TRIP_ID), [existingSettlement])

    const { result } = await renderHook(() => useSettleDebt(TRIP_ID), { wrapper })

    result.current.mutate(SETTLE_PARAMS)

    await waitFor(() => expect(result.current.isError).toBe(true))

    // Snapshot must be restored — only original settlement remains
    const restored = queryClient.getQueryData<Settlement[]>(queryKeys.settlements.all(TRIP_ID))!
    expect(restored).toHaveLength(1)
    expect(restored[0].id).toBe('s-restore')
  })

  it('onSettled invalidates the settlements query', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({ error: null })

    const { queryClient, wrapper } = createTestContext()
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')

    const { result } = await renderHook(() => useSettleDebt(TRIP_ID), { wrapper })

    result.current.mutate(SETTLE_PARAMS)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.settlements.all(TRIP_ID),
    })
  })
})
