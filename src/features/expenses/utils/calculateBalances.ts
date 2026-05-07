import type { Collaborator, ExpenseWithSplits, UserBalance } from '@types/index'

export function calculateBalances(
  expenses: ExpenseWithSplits[],
  collaborators: Collaborator[]
): UserBalance[] {
  const map: Record<string, UserBalance> = {}

  for (const c of collaborators) {
    map[c.user_id] = { ...c, paid: 0, owes: 0, balance: 0 }
  }

  for (const expense of expenses) {
    if (map[expense.payer_id]) {
      map[expense.payer_id].paid += expense.amount
    }
    for (const split of expense.splits) {
      if (!split.is_settled && map[split.user_id]) {
        map[split.user_id].owes += split.amount
      }
    }
  }

  for (const b of Object.values(map)) {
    b.balance = Math.round((b.paid - b.owes) * 100) / 100
  }

  return Object.values(map)
}
