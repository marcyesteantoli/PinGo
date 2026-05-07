export function formatCurrency(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(amount)
}

export function splitEqually(total: number, count: number): number {
  return Math.round((total / count) * 100) / 100
}
