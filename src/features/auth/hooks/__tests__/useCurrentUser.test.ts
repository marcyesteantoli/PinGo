import { waitFor } from '@testing-library/react-native'
import { renderHook } from '@testing-library/react-native'
import { supabase } from '@lib/supabase'
import { useCurrentUser } from '../useCurrentUser'
import { createWrapper } from '@/__tests__/helpers/queryWrapper'

beforeEach(() => jest.clearAllMocks())

describe('useCurrentUser', () => {
  it('returns user when getUser resolves successfully', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' }
    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    const { result } = await renderHook(() => useCurrentUser(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockUser)
  })

  it('isLoading is true initially then false after fetch completes', async () => {
    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
      error: null,
    })

    const { result } = await renderHook(() => useCurrentUser(), {
      wrapper: createWrapper(),
    })

    // On first render the query is in fetching state
    expect(result.current.isLoading).toBe(true)

    await waitFor(() => expect(result.current.isLoading).toBe(false))
  })

  it('isError is true when Supabase returns an error', async () => {
    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: null },
      error: { message: 'Auth service unavailable' },
    })

    const { result } = await renderHook(() => useCurrentUser(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.data).toBeUndefined()
  })

  it('data is null when no active session (user is null, no error)', async () => {
    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: null },
      error: null,
    })

    const { result } = await renderHook(() => useCurrentUser(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeNull()
  })
})
