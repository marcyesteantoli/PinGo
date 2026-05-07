export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date))
}

export function formatShortDate(date: string): string {
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' }).format(new Date(date))
}

export function formatDateRange(start: string, end: string): string {
  return `${formatShortDate(start)} — ${formatShortDate(end)}`
}
