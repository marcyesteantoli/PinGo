export function formatDate(date: string, locale = 'es-ES'): string {
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date))
}

export function formatShortDate(date: string, locale = 'es-ES'): string {
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(new Date(date))
}

export function formatDateRange(start: string, end: string, locale = 'es-ES'): string {
  return `${formatShortDate(start, locale)} - ${formatShortDate(end, locale)}`
}

export function formatDateWithWeekday(date: string, locale = 'es-ES'): string {
  const d = new Date(date + 'T00:00:00')
  const weekday = new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(d)
  const dayMonth = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(d)
  return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)} ${dayMonth}`
}
