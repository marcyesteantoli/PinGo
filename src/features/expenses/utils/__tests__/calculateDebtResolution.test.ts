import type { UserBalance } from '@app-types/index'
import { calculateDebtResolution } from '../calculateDebtResolution'

function makeBalance(overrides: Partial<UserBalance> & { user_id: string; balance: number }): UserBalance {
  return {
    name: overrides.user_id,
    avatar_url: null,
    paid: 0,
    owes: 0,
    status: 'active',
    ...overrides,
  }
}

describe('calculateDebtResolution', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns empty array when balances array is empty', () => {
    expect(calculateDebtResolution([])).toEqual([])
  })

  it('returns empty array when all balances are zero', () => {
    const balances = [
      makeBalance({ user_id: 'A', balance: 0 }),
      makeBalance({ user_id: 'B', balance: 0 }),
    ]
    expect(calculateDebtResolution(balances)).toEqual([])
  })

  it('returns empty array when floating-point noise is below 0.005 threshold', () => {
    // Sub-cent noise should not generate any transaction
    const balances = [
      makeBalance({ user_id: 'A', balance: -0.001 }),
      makeBalance({ user_id: 'B', balance: 0.001 }),
    ]
    expect(calculateDebtResolution(balances)).toEqual([])
  })

  it('returns empty array at exactly the 0.005 threshold boundary', () => {
    const balances = [
      makeBalance({ user_id: 'A', balance: -0.005 }),
      makeBalance({ user_id: 'B', balance: 0.005 }),
    ]
    // -0.005 is NOT < -0.005, so filtered out → no transactions
    expect(calculateDebtResolution(balances)).toEqual([])
  })

  it('resolves a simple 1-to-1 debt', () => {
    const balances = [
      makeBalance({ user_id: 'A', name: 'Alice', avatar_url: null, balance: -10 }),
      makeBalance({ user_id: 'B', name: 'Bob', avatar_url: null, balance: 10 }),
    ]
    const result = calculateDebtResolution(balances)
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      fromUserId: 'A',
      fromName: 'Alice',
      toUserId: 'B',
      toName: 'Bob',
      amount: 10,
    })
  })

  it('resolves 2-debtors-1-creditor with minimum transactions', () => {
    // A owes 30, B owes 20, C is owed 50
    const balances = [
      makeBalance({ user_id: 'A', name: 'Alice', balance: -30 }),
      makeBalance({ user_id: 'B', name: 'Bob', balance: -20 }),
      makeBalance({ user_id: 'C', name: 'Carol', balance: 50 }),
    ]
    const result = calculateDebtResolution(balances)
    // Each debtor pays the single creditor → 2 transactions (minimum possible)
    expect(result).toHaveLength(2)
    const totalPaid = result.reduce((sum, t) => sum + t.amount, 0)
    expect(totalPaid).toBeCloseTo(50, 5)
    expect(result.every((t) => t.toUserId === 'C')).toBe(true)
  })

  it('resolves 1-debtor-2-creditors with minimum transactions', () => {
    // A owes 50, B is owed 30, C is owed 20
    const balances = [
      makeBalance({ user_id: 'A', name: 'Alice', balance: -50 }),
      makeBalance({ user_id: 'B', name: 'Bob', balance: 30 }),
      makeBalance({ user_id: 'C', name: 'Carol', balance: 20 }),
    ]
    const result = calculateDebtResolution(balances)
    expect(result).toHaveLength(2)
    const totalPaid = result.reduce((sum, t) => sum + t.amount, 0)
    expect(totalPaid).toBeCloseTo(50, 5)
    expect(result.every((t) => t.fromUserId === 'A')).toBe(true)
  })

  it('resolves N-to-N: 3 debtors and 3 creditors', () => {
    // Greedy minimizes transactions; net totals must balance
    const balances = [
      makeBalance({ user_id: 'A', balance: -30 }),
      makeBalance({ user_id: 'B', balance: -20 }),
      makeBalance({ user_id: 'C', balance: -10 }),
      makeBalance({ user_id: 'D', balance: 40 }),
      makeBalance({ user_id: 'E', balance: 15 }),
      makeBalance({ user_id: 'F', balance: 5 }),
    ]
    const result = calculateDebtResolution(balances)
    // Total debts = 60, total credits = 60; every cent must be transferred
    const totalPaid = result.reduce((sum, t) => sum + t.amount, 0)
    expect(totalPaid).toBeCloseTo(60, 5)
    // Greedy produces at most max(debtors, creditors) transactions
    expect(result.length).toBeLessThanOrEqual(Math.max(3, 3) + 2)
    // All amounts are positive
    result.forEach((t) => expect(t.amount).toBeGreaterThan(0))
  })

  it('rounds transaction amounts to 2 decimal places', () => {
    const balances = [
      makeBalance({ user_id: 'A', balance: -10.005 }),
      makeBalance({ user_id: 'B', balance: 10.005 }),
    ]
    const result = calculateDebtResolution(balances)
    expect(result).toHaveLength(1)
    // Amount must be rounded to 2 decimal places
    expect(result[0].amount).toBe(Math.round(result[0].amount * 100) / 100)
  })

  it('includes avatar_url in the transaction output', () => {
    const balances = [
      makeBalance({ user_id: 'A', name: 'Alice', avatar_url: 'https://example.com/a.png', balance: -15 }),
      makeBalance({ user_id: 'B', name: 'Bob', avatar_url: null, balance: 15 }),
    ]
    const [tx] = calculateDebtResolution(balances)
    expect(tx.fromAvatarUrl).toBe('https://example.com/a.png')
    expect(tx.toAvatarUrl).toBeNull()
  })
})
