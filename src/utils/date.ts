export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date))
}

export function formatShortDate(date: string): string {
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' }).format(new Date(date))
}

export function formatDateRange(start: string, end: string): string {
  return `${formatShortDate(start)} - ${formatShortDate(end)}`
}

export function formatDateWithWeekday(date: string): string {
  const d = new Date(date + 'T00:00:00')
  const weekday = new Intl.DateTimeFormat('es-ES', { weekday: 'long' }).format(d)
  const dayMonth = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' }).format(d)
  return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)} ${dayMonth}`
}
