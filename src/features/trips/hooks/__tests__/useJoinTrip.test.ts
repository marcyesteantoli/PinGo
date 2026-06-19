import React from 'react'
import { renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { useJoinTrip } from '../useJoinTrip'
import { queryKeys } from '@lib/queryKeys'

beforeEach(() => jest.clearAllMocks())

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

describe('useJoinTrip', () => {
  it('converts join_code to uppercase before calling RPC', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({ data: 'trip-abc', error: null })

    const { wrapper } = createTestContext()
    const { result } = await renderHook(() => useJoinTrip(), { wrapper })

    result.current.mutate({ join_code: 'abc123' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.rpc).toHaveBeenCalledWith('join_trip_by_code', {
      p_join_code: 'ABC123',
    })
  })

  it('uppercase input passes through correctly', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({ data: 'trip-xyz', error: null })

    const { wrapper } = createTestContext()
    const { result } = await renderHook(() => useJoinTrip(), { wrapper })

    result.current.mutate({ join_code: 'XYZ999' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.rpc).toHaveBeenCalledWith('join_trip_by_code', {
      p_join_code: 'XYZ999',
    })
  })

  it('Invalid join code error → throws with correct Spanish message', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({
      data: null,
      error: { message: 'Invalid join code provided' },
    })

    const { wrapper } = createTestContext()
    const { result } = await renderHook(() => useJoinTrip(), { wrapper })

    result.current.mutate({ join_code: 'NOEX1S' })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error?.message).toBe('Código de viaje no encontrado')
  })

  it('Already a member error → throws with correct Spanish message', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({
      data: null,
      error: { message: 'Already a member of this trip' },
    })

    const { wrapper } = createTestContext()
    const { result } = await renderHook(() => useJoinTrip(), { wrapper })

    result.current.mutate({ join_code: 'EXIST1' })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error?.message).toBe('Ya eres colaborador de este viaje')
  })

  it('generic error falls through with the raw message', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({
      data: null,
      error: { message: 'Unexpected server error' },
    })

    const { wrapper } = createTestContext()
    const { result } = await renderHook(() => useJoinTrip(), { wrapper })

    result.current.mutate({ join_code: 'ERRZZZ' })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error?.message).toBe('Unexpected server error')
  })

  it('on success invalidates trips list query', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({ data: 'trip-new-001', error: null })

    const { queryClient, wrapper } = createTestContext()
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')

    const { result } = await renderHook(() => useJoinTrip(), { wrapper })

    result.current.mutate({ join_code: 'NEWTRP' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.trips.list(),
    })
  })

  it('on success returns the tripId from the RPC result', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({ data: 'trip-returned-id', error: null })

    const { wrapper } = createTestContext()
    const { result } = await renderHook(() => useJoinTrip(), { wrapper })

    result.current.mutate({ join_code: 'RETID1' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toBe('trip-returned-id')
  })
})
