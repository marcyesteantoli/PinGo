import type { Collaborator, ExpenseWithSplits, Settlement } from '@app-types/index'
import { calculateBalances } from '../calculateBalances'

// ── helpers ──────────────────────────────────────────────────────────────────

function makeCollaborator(user_id: string, name = user_id): Collaborator {
  return { user_id, name, avatar_url: null, role: 'member', status: 'active', joined_at: '2024-01-01T00:00:00Z' }
}

function makeExpense(
  overrides: {
    id?: string
    payer_id: string
    amount: number
    splits: Array<{ user_id: string; amount: number }>
  }
): ExpenseWithSplits {
  return {
    id: overrides.id ?? 'exp-1',
    trip_id: 'trip-1',
    experience_id: null,
    payer_id: overrides.payer_id,
    amount: overrides.amount,
    description: 'Test expense',
    currency: 'EUR',
    paid_at: '2024-01-01T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    splits: overrides.splits.map((s, i) => ({
      id: `split-${i}`,
      expense_id: overrides.id ?? 'exp-1',
      user_id: s.user_id,
      amount: s.amount,
      created_at: '2024-01-01T00:00:00Z',
    })),
    payer: {
      id: overrides.payer_id,
      username: overrides.payer_id,
      full_name: overrides.payer_id,
      avatar_url: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    experience: null,
  } as unknown as ExpenseWithSplits
}

function makeSettlement(from_user_id: string, to_user_id: string, amount: number): Settlement {
  return {
    id: `s-${from_user_id}-${to_user_id}`,
    trip_id: 'trip-1',
    from_user_id,
    to_user_id,
    amount,
    settled_by: null,
    created_at: '2024-01-01T00:00:00Z',
  }
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('calculateBalances', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns zero balances when there are no expenses', () => {
    const collaborators = [makeCollaborator('A'), makeCollaborator('B')]
    const result = calculateBalances([], collaborators)
    expect(result).toHaveLength(2)
    result.forEach((b) => {
      expect(b.paid).toBe(0)
      expect(b.owes).toBe(0)
      expect(b.balance).toBe(0)
    })
  })

  it('all collaborators appear in the result even if they have no expenses', () => {
    const collaborators = [makeCollaborator('A'), makeCollaborator('B'), makeCollaborator('C')]
    const expense = makeExpense({ payer_id: 'A', amount: 30, splits: [{ user_id: 'A', amount: 30 }] })
    const result = calculateBalances([expense], collaborators)
    const ids = result.map((b) => b.user_id)
    expect(ids).toContain('A')
    expect(ids).toContain('B')
    expect(ids).toContain('C')
  })

  it('calculates correct balance when A pays for A and B equally', () => {
    // A pays 20, split: A owes 10, B owes 10
    // A balance: 20 - 10 = +10 (others owe A)
    // B balance: 0 - 10 = -10 (B owes A)
    const collaborators = [makeCollaborator('A'), makeCollaborator('B')]
    const expense = makeExpense({
      payer_id: 'A',
      amount: 20,
      splits: [
        { user_id: 'A', amount: 10 },
        { user_id: 'B', amount: 10 },
      ],
    })
    const result = calculateBalances([expense], collaborators)
    const balanceA = result.find((b) => b.user_id === 'A')!
    const balanceB = result.find((b) => b.user_id === 'B')!
    expect(balanceA.paid).toBe(20)
    expect(balanceA.owes).toBe(10)
    expect(balanceA.balance).toBe(10)
    expect(balanceB.paid).toBe(0)
    expect(balanceB.owes).toBe(10)
    expect(balanceB.balance).toBe(-10)
  })

  it('handles multiple expenses with multiple payers', () => {
    // Expense 1: A pays 30, A owes 15, B owes 15
    // Expense 2: B pays 30, A owes 15, B owes 15
    // Net: A paid 30, owes 30 → balance 0; B paid 30, owes 30 → balance 0
    const collaborators = [makeCollaborator('A'), makeCollaborator('B')]
    const exp1 = makeExpense({
      id: 'exp-1',
      payer_id: 'A',
      amount: 30,
      splits: [
        { user_id: 'A', amount: 15 },
        { user_id: 'B', amount: 15 },
      ],
    })
    const exp2 = makeExpense({
      id: 'exp-2',
      payer_id: 'B',
      amount: 30,
      splits: [
        { user_id: 'A', amount: 15 },
        { user_id: 'B', amount: 15 },
      ],
    })
    const result = calculateBalances([exp1, exp2], collaborators)
    result.forEach((b) => expect(b.balance).toBe(0))
  })

  it('settlements reduce the debtor balance and creditor balance', () => {
    // A pays 20 for both, so A: +10, B: -10
    // Then B settles 5 to A: B balance goes from -10 to -5, A goes from +10 to +5
    const collaborators = [makeCollaborator('A'), makeCollaborator('B')]
    const expense = makeExpense({
      payer_id: 'A',
      amount: 20,
      splits: [
        { user_id: 'A', amount: 10 },
        { user_id: 'B', amount: 10 },
      ],
    })
    const settlement = makeSettlement('B', 'A', 5)
    const result = calculateBalances([expense], collaborators, [settlement])
    const balanceA = result.find((b) => b.user_id === 'A')!
    const balanceB = result.find((b) => b.user_id === 'B')!
    // from_user: balance += amount (B sent money, their debt reduced)
    // to_user: balance -= amount (A received, their credit reduced)
    expect(balanceB.balance).toBe(-5)
    expect(balanceA.balance).toBe(5)
  })

  it('a full settlement brings both balances to zero', () => {
    const collaborators = [makeCollaborator('A'), makeCollaborator('B')]
    const expense = makeExpense({
      payer_id: 'A',
      amount: 20,
      splits: [
        { user_id: 'A', amount: 10 },
        { user_id: 'B', amount: 10 },
      ],
    })
    const settlement = makeSettlement('B', 'A', 10)
    const result = calculateBalances([expense], collaborators, [settlement])
    result.forEach((b) => expect(b.balance).toBe(0))
  })

  it('rounds balance to 2 decimal places', () => {
    // 10 / 3 = 3.333... — balance should be rounded
    const collaborators = [makeCollaborator('A'), makeCollaborator('B'), makeCollaborator('C')]
    const expense = makeExpense({
      payer_id: 'A',
      amount: 10,
      splits: [
        { user_id: 'A', amount: 3.34 },
        { user_id: 'B', amount: 3.33 },
        { user_id: 'C', amount: 3.33 },
      ],
    })
    const result = calculateBalances([expense], collaborators)
    result.forEach((b) => {
      const rounded = Math.round(b.balance * 100) / 100
      expect(b.balance).toBe(rounded)
    })
  })

  it('ignores splits for users not in collaborators list', () => {
    // Expense has a split for user 'X' who is not a collaborator
    const collaborators = [makeCollaborator('A'), makeCollaborator('B')]
    const expense = makeExpense({
      payer_id: 'A',
      amount: 30,
      splits: [
        { user_id: 'A', amount: 10 },
        { user_id: 'B', amount: 10 },
        { user_id: 'X', amount: 10 }, // not a collaborator
      ],
    })
    const result = calculateBalances([expense], collaborators)
    // Should not include 'X' in result
    expect(result.find((b) => b.user_id === 'X')).toBeUndefined()
    // A paid 30, owes 10 → balance +20
    const balanceA = result.find((b) => b.user_id === 'A')!
    expect(balanceA.balance).toBe(20)
  })
})
