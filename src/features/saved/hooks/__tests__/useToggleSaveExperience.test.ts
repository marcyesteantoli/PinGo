import React from 'react'
import { renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { useToggleSaveExperience } from '../useToggleSaveExperience'
import { queryKeys } from '@lib/queryKeys'

beforeEach(() => jest.clearAllMocks())

const EXPERIENCE_ID = 'exp-xyz'
const MOCK_USER = { id: 'user-123', email: 'test@example.com' }

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

// Helper: build a supabase chain mock for from().delete().eq().eq()
function mockDeleteChain(error: any = null) {
  const eqChain = jest.fn().mockResolvedValue({ error })
  const firstEq = jest.fn().mockReturnValue({ eq: eqChain })
  const deleteFn = jest.fn().mockReturnValue({ eq: firstEq })
  ;(supabase.from as jest.Mock).mockReturnValue({ delete: deleteFn })
  return { deleteFn, firstEq, eqChain }
}

// Helper: build a supabase chain mock for from().insert()
function mockInsertChain(error: any = null) {
  const insertFn = jest.fn().mockResolvedValue({ error })
  ;(supabase.from as jest.Mock).mockReturnValue({ insert: insertFn })
  return { insertFn }
}

describe('useToggleSaveExperience', () => {
  it('calls delete when isSaved is true', async () => {
    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: MOCK_USER },
      error: null,
    })
    const { deleteFn } = mockDeleteChain()

    const { wrapper } = createTestContext()
    const { result } = await renderHook(() => useToggleSaveExperience(EXPERIENCE_ID), { wrapper })

    result.current.mutate(true)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.from).toHaveBeenCalledWith('user_saved_experiences')
    expect(deleteFn).toHaveBeenCalled()
  })

  it('calls insert when isSaved is false', async () => {
    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: MOCK_USER },
      error: null,
    })
    const { insertFn } = mockInsertChain()

    const { wrapper } = createTestContext()
    const { result } = await renderHook(() => useToggleSaveExperience(EXPERIENCE_ID), { wrapper })

    result.current.mutate(false)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.from).toHaveBeenCalledWith('user_saved_experiences')
    expect(insertFn).toHaveBeenCalledWith({ user_id: MOCK_USER.id, experience_id: EXPERIENCE_ID })
  })

  it('onMutate: optimistically flips isSaved from true to false', async () => {
    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: MOCK_USER },
      error: null,
    })
    let resolveDelete!: (val: any) => void
    const eqChain = jest.fn().mockReturnValue(new Promise((res) => { resolveDelete = res }))
    const firstEq = jest.fn().mockReturnValue({ eq: eqChain })
    const deleteFn = jest.fn().mockReturnValue({ eq: firstEq })
    ;(supabase.from as jest.Mock).mockReturnValue({ delete: deleteFn })

    const { queryClient, wrapper } = createTestContext()
    const isSavedKey = queryKeys.savedExperiences.isSaved(EXPERIENCE_ID)
    queryClient.setQueryData(isSavedKey, true)

    const { result } = await renderHook(() => useToggleSaveExperience(EXPERIENCE_ID), { wrapper })

    result.current.mutate(true)

    // After onMutate runs, cache should be flipped to false before server responds
    await waitFor(() => {
      return queryClient.getQueryData<boolean>(isSavedKey) === false
    })

    expect(queryClient.getQueryData<boolean>(isSavedKey)).toBe(false)

    resolveDelete({ error: null })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('onMutate: optimistically flips isSaved from false to true', async () => {
    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: MOCK_USER },
      error: null,
    })
    let resolveInsert!: (val: any) => void
    const insertFn = jest.fn().mockReturnValue(new Promise((res) => { resolveInsert = res }))
    ;(supabase.from as jest.Mock).mockReturnValue({ insert: insertFn })

    const { queryClient, wrapper } = createTestContext()
    const isSavedKey = queryKeys.savedExperiences.isSaved(EXPERIENCE_ID)
    queryClient.setQueryData(isSavedKey, false)

    const { result } = await renderHook(() => useToggleSaveExperience(EXPERIENCE_ID), { wrapper })

    result.current.mutate(false)

    await waitFor(() => {
      return queryClient.getQueryData<boolean>(isSavedKey) === true
    })

    expect(queryClient.getQueryData<boolean>(isSavedKey)).toBe(true)

    resolveInsert({ error: null })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('onError: restores isSaved snapshot when delete fails', async () => {
    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: MOCK_USER },
      error: null,
    })
    // Simulate DB error on delete
    const eqChain = jest.fn().mockResolvedValue({ error: { message: 'delete failed' } })
    const firstEq = jest.fn().mockReturnValue({ eq: eqChain })
    const deleteFn = jest.fn().mockReturnValue({ eq: firstEq })
    ;(supabase.from as jest.Mock).mockReturnValue({ delete: deleteFn })

    const { queryClient, wrapper } = createTestContext()
    const isSavedKey = queryKeys.savedExperiences.isSaved(EXPERIENCE_ID)
    queryClient.setQueryData(isSavedKey, true)

    const { result } = await renderHook(() => useToggleSaveExperience(EXPERIENCE_ID), { wrapper })

    result.current.mutate(true)

    await waitFor(() => expect(result.current.isError).toBe(true))

    // Should have been rolled back to original value (true)
    expect(queryClient.getQueryData<boolean>(isSavedKey)).toBe(true)
  })

  it('onSettled: invalidates isSaved and byUser queries', async () => {
    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: MOCK_USER },
      error: null,
    })
    mockDeleteChain()

    const { queryClient, wrapper } = createTestContext()
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')

    const { result } = await renderHook(() => useToggleSaveExperience(EXPERIENCE_ID), { wrapper })

    result.current.mutate(true)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.savedExperiences.isSaved(EXPERIENCE_ID),
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.savedExperiences.byUser(),
    })
  })
})
