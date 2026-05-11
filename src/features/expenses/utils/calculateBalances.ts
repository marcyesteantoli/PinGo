import type { Collaborator, ExpenseWithSplits, Settlement, UserBalance } from '@types/index'

// Gross algorithm:
// paid = total expense amount I fronted as payer
// owes = sum of all my splits (my fair share)
// balance = (paid - owes) + sent_settlements - received_settlements  (pending)
export function calculateBalances(
  expenses: ExpenseWithSplits[],
  collaborators: Collaborator[],
  settlements: Settlement[] = []
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
      if (map[split.user_id]) {
        map[split.user_id].owes += split.amount
      }
    }
  }

  for (const b of Object.values(map)) {
    b.balance = Math.round((b.paid - b.owes) * 100) / 100
  }

  for (const s of settlements) {
    if (map[s.from_user_id]) {
      map[s.from_user_id].balance = Math.round((map[s.from_user_id].balance + s.amount) * 100) / 100
    }
    if (map[s.to_user_id]) {
      map[s.to_user_id].balance = Math.round((map[s.to_user_id].balance - s.amount) * 100) / 100
    }
  }

  return Object.values(map)
}
