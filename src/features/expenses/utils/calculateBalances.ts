import type { Collaborator, ExpenseWithSplits, UserBalance } from '@types/index'

// Zero-sum algorithm:
// paid = sum of OTHER participants' unsettled splits in expenses I paid (what others still owe me)
// owes = sum of MY unsettled splits in expenses others paid (what I still owe)
// balance = paid - owes  →  sum of all balances = 0
export function calculateBalances(
  expenses: ExpenseWithSplits[],
  collaborators: Collaborator[]
): UserBalance[] {
  const map: Record<string, UserBalance> = {}

  for (const c of collaborators) {
    map[c.user_id] = { ...c, paid: 0, owes: 0, balance: 0 }
  }

  for (const expense of expenses) {
    for (const split of expense.splits) {
      if (split.is_settled) continue
      if (split.user_id === expense.payer_id) continue // payer's own share, skip

      if (map[expense.payer_id]) {
        map[expense.payer_id].paid += split.amount // others owe me this
      }
      if (map[split.user_id]) {
        map[split.user_id].owes += split.amount // I owe payer this
      }
    }
  }

  for (const b of Object.values(map)) {
    b.balance = Math.round((b.paid - b.owes) * 100) / 100
  }

  return Object.values(map)
}
