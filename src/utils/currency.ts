export function formatCurrency(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(amount)
}

// Importe para el participante en posición `index` (0-based) de un reparto igual.
// Usa floor + remainder en el primer participante → la suma de todos los splits = total exacto.
export function splitEqually(total: number, count: number, index = 0): number {
  const totalCents = Math.round(total * 100)
  const baseCents = Math.floor(totalCents / count)
  const remainder = totalCents - baseCents * count
  return (baseCents + (index === 0 ? remainder : 0)) / 100
}

// Devuelve array completo de importes que suma exactamente `total`.
export function splitEquallyAll(total: number, participantIds: string[]): { userId: string; amount: number }[] {
  const count = participantIds.length
  const totalCents = Math.round(total * 100)
  const baseCents = Math.floor(totalCents / count)
  const remainder = totalCents - baseCents * count
  return participantIds.map((userId, i) => ({
    userId,
    amount: (baseCents + (i === 0 ? remainder : 0)) / 100,
  }))
}
