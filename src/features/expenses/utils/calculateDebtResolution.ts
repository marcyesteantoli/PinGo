import type { UserBalance } from '@types/index'

export type DebtTransaction = {
  fromUserId: string
  fromName: string
  fromAvatarUrl: string | null
  toUserId: string
  toName: string
  toAvatarUrl: string | null
  amount: number
}

// Greedy algorithm: minimize number of transactions to settle all debts
export function calculateDebtResolution(balances: UserBalance[]): DebtTransaction[] {
  const debtors = balances
    .filter((b) => b.balance < -0.005)
    .map((b) => ({ ...b, remaining: Math.abs(b.balance) }))
    .sort((a, b) => b.remaining - a.remaining)

  const creditors = balances
    .filter((b) => b.balance > 0.005)
    .map((b) => ({ ...b, remaining: b.balance }))
    .sort((a, b) => b.remaining - a.remaining)

  const transactions: DebtTransaction[] = []
  let di = 0
  let ci = 0

  while (di < debtors.length && ci < creditors.length) {
    const debtor = debtors[di]
    const creditor = creditors[ci]
    const amount = Math.min(debtor.remaining, creditor.remaining)

    if (amount > 0.005) {
      transactions.push({
        fromUserId: debtor.user_id,
        fromName: debtor.name,
        fromAvatarUrl: debtor.avatar_url,
        toUserId: creditor.user_id,
        toName: creditor.name,
        toAvatarUrl: creditor.avatar_url,
        amount: Math.round(amount * 100) / 100,
      })
    }

    debtor.remaining -= amount
    creditor.remaining -= amount

    if (debtor.remaining < 0.005) di++
    if (creditor.remaining < 0.005) ci++
  }

  return transactions
}
