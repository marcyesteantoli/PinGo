import { useState } from 'react'
import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import type { Experience, Trip, TripDestination } from '@types/index'

type Location = { name: string; lat: number; lng: number; city?: string }

const EXPERIENCE_EMOJI: Record<string, string> = {
  transport: '✈️',
  accommodation: '🏨',
  activity: '🎯',
  restaurant: '🍽️',
  entertainment: '🎭',
  other: '📌',
}

function groupByDate(experiences: Experience[]): Array<{ date: string; items: Experience[] }> {
  const groups: Record<string, Experience[]> = {}
  for (const exp of experiences) {
    const key = exp.date ?? '__undated__'
    if (!groups[key]) groups[key] = []
    groups[key].push(exp)
  }
  const sortByTime = (exps: Experience[]) =>
    [...exps].sort((a, b) => {
      if (!a.start_time && !b.start_time) return 0
      if (!a.start_time) return 1
      if (!b.start_time) return -1
      return a.start_time.localeCompare(b.start_time)
    })

  const dated = Object.entries(groups)
    .filter(([k]) => k !== '__undated__')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, items]) => ({ date, items: sortByTime(items) }))

  const undated = groups['__undated__']
  if (undated?.length) dated.push({ date: '__undated__', items: sortByTime(undated) })
  return dated
}

function formatDate(dateStr: string, locale: string): string {
  if (dateStr === '__undated__') return locale.startsWith('es') ? 'Sin fecha' : 'Undated'
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function buildHtml(trip: Trip, experiences: Experience[], destinations: TripDestination[], locale: string): string {
  const sections = groupByDate(experiences)

  const destinationNames = destinations.map(d => d.name).join(' · ')

  const dateRange = trip.start_date && trip.end_date
    ? `${new Date(trip.start_date).toLocaleDateString(locale, { month: 'short', day: 'numeric' })} – ${new Date(trip.end_date).toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })}`
    : ''

  const sectionsHtml = sections.map(({ date, items }) => {
    const rowsHtml = items.map(exp => {
      const emoji = EXPERIENCE_EMOJI[exp.type] ?? '📌'
      const time = exp.start_time
        ? `<span class="time">${exp.start_time}${exp.end_time ? ` – ${exp.end_time}` : ''}</span>`
        : '<span class="time no-time">—</span>'
      const loc = (typeof exp.location === 'object' && exp.location !== null && 'name' in exp.location)
        ? (exp.location as Location).name
        : ''
      return `
        <tr>
          <td class="cell-time">${time}</td>
          <td class="cell-emoji">${emoji}</td>
          <td class="cell-title">
            <span class="exp-title">${exp.title}</span>
            ${loc ? `<span class="exp-loc">${loc}</span>` : ''}
          </td>
        </tr>`
    }).join('')

    return `
      <div class="day-section">
        <div class="day-header">${formatDate(date, locale)}</div>
        <table class="exp-table">${rowsHtml}</table>
      </div>`
  }).join('')

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #1a1a1a; background: #fff; padding: 40px 48px; font-size: 14px; line-height: 1.5; }
  .header { border-bottom: 2px solid #0a84ff; padding-bottom: 20px; margin-bottom: 32px; }
  .trip-title { font-size: 28px; font-weight: 700; color: #0a84ff; margin-bottom: 4px; }
  .trip-meta { font-size: 13px; color: #6b7280; }
  .trip-meta span + span::before { content: ' · '; }
  .day-section { margin-bottom: 28px; }
  .day-header { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #0a84ff; border-left: 3px solid #0a84ff; padding-left: 10px; margin-bottom: 10px; }
  .exp-table { width: 100%; border-collapse: collapse; }
  .exp-table tr { border-bottom: 1px solid #f3f4f6; }
  .exp-table tr:last-child { border-bottom: none; }
  .cell-time { width: 90px; padding: 9px 12px 9px 0; vertical-align: top; }
  .time { font-size: 12px; color: #6b7280; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .no-time { color: #d1d5db; }
  .cell-emoji { width: 28px; padding: 9px 8px 9px 0; vertical-align: top; font-size: 16px; }
  .cell-title { padding: 9px 0; vertical-align: top; }
  .exp-title { display: block; font-size: 14px; font-weight: 600; color: #111827; }
  .exp-loc { display: block; font-size: 12px; color: #9ca3af; margin-top: 2px; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #f3f4f6; font-size: 11px; color: #d1d5db; text-align: right; }
</style>
</head>
<body>
  <div class="header">
    <div class="trip-title">${trip.title}</div>
    <div class="trip-meta">
      ${dateRange ? `<span>${dateRange}</span>` : ''}
      ${destinationNames ? `<span>${destinationNames}</span>` : ''}
    </div>
  </div>
  ${sectionsHtml}
  <div class="footer">TripSync</div>
</body>
</html>`
}

interface ExportParams {
  trip: Trip
  experiences: Experience[]
  destinations: TripDestination[]
  locale?: string
}

export function useExportTimelinePdf() {
  const [isExporting, setIsExporting] = useState(false)

  const exportPdf = async ({ trip, experiences, destinations, locale = 'en' }: ExportParams) => {
    setIsExporting(true)
    try {
      const html = buildHtml(trip, experiences, destinations, locale)
      const { uri } = await Print.printToFileAsync({ html, base64: false })
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: trip.title,
        UTI: 'com.adobe.pdf',
      })
    } finally {
      setIsExporting(false)
    }
  }

  return { exportPdf, isExporting }
}
