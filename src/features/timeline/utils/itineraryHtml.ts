import type { Experience, Trip } from '@app-types/index'
import { formatDateRange, formatDateWithWeekday } from '@utils/date'
import { formatTimeRange } from '@features/timeline/types'
import type { Section } from './groupByDate'
import { UNDATED_SENTINEL } from './groupByDate'

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function getLocationName(location: Experience['location']): string | null {
  if (
    typeof location === 'object' &&
    location !== null &&
    'name' in location &&
    typeof (location as { name: unknown }).name === 'string'
  ) {
    return (location as { name: string }).name
  }
  return null
}

function renderExperience(exp: Experience, locale: string): string {
  const timeRange = formatTimeRange(exp.start_time, exp.end_time)
  const locationName = getLocationName(exp.location)

  return `
    <div class="experience">
      <div class="experience-header">
        <span class="experience-title">${escapeHtml(exp.title)}</span>
        ${timeRange ? `<span class="experience-time">${escapeHtml(timeRange)}</span>` : ''}
      </div>
      ${locationName ? `<div class="experience-location">&#128205; ${escapeHtml(locationName)}</div>` : ''}
    </div>
  `
}

function renderSection(section: Section, locale: string, undatedSectionTitle: string, index: number, isUndated: boolean): string {
  const title = isUndated
    ? undatedSectionTitle
    : formatDateWithWeekday(section.title, locale)

  const dayLabel = isUndated ? '' : `<span class="day-badge">Day ${index + 1}</span>`

  return `
    <div class="section">
      <div class="section-header">
        ${dayLabel}
        <span class="section-title">${escapeHtml(title)}</span>
      </div>
      <div class="experience-list">
        ${section.data.length > 0
          ? section.data.map(exp => renderExperience(exp, locale)).join('')
          : '<div class="empty-day">—</div>'
        }
      </div>
    </div>
  `
}

export function buildItineraryHtml(
  trip: Trip,
  sections: Section[],
  locale: string,
  undatedSectionTitle: string
): string {
  const dateRange = formatDateRange(trip.start_date, trip.end_date, locale)

  const datedSections = sections.filter(s => s.title !== UNDATED_SENTINEL)
  const undatedSections = sections.filter(s => s.title === UNDATED_SENTINEL)
  const orderedSections = [...datedSections, ...undatedSections]

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }

          body {
            font-family: -apple-system, Helvetica Neue, Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
            padding: 40px 44px;
            font-size: 13px;
            line-height: 1.5;
          }

          /* ── Header ── */
          .trip-header {
            border-bottom: 3px solid #6366f1;
            padding-bottom: 20px;
            margin-bottom: 32px;
          }
          .trip-title {
            font-size: 28px;
            font-weight: 800;
            letter-spacing: -0.5px;
            color: #0f172a;
            margin-bottom: 6px;
          }
          .trip-meta {
            display: flex;
            align-items: center;
            gap: 16px;
          }
          .trip-dates {
            font-size: 13px;
            font-weight: 600;
            color: #6366f1;
          }
          .trip-count {
            font-size: 12px;
            color: #94a3b8;
          }

          /* ── Day Section ── */
          .section {
            margin-bottom: 28px;
            break-inside: avoid;
          }
          .section-header {
            display: flex;
            align-items: center;
            gap: 10px;
            background: #eef2ff;
            border-left: 4px solid #6366f1;
            border-radius: 0 8px 8px 0;
            padding: 10px 14px;
            margin-bottom: 4px;
          }
          .day-badge {
            background: #6366f1;
            color: #ffffff;
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            padding: 3px 8px;
            border-radius: 20px;
            white-space: nowrap;
            flex-shrink: 0;
          }
          .section-title {
            font-size: 14px;
            font-weight: 700;
            color: #3730a3;
            text-transform: capitalize;
          }

          /* ── Experience List ── */
          .experience-list {
            padding: 4px 0 4px 18px;
            border-left: 2px solid #e0e7ff;
            margin-left: 8px;
          }
          .experience {
            padding: 10px 12px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            margin-bottom: 6px;
            break-inside: avoid;
          }
          .experience:last-child {
            margin-bottom: 0;
          }
          .experience-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 12px;
          }
          .experience-title {
            font-size: 13px;
            font-weight: 700;
            color: #0f172a;
            flex: 1;
          }
          .experience-time {
            font-size: 11px;
            font-weight: 700;
            color: #6366f1;
            background: #eef2ff;
            padding: 2px 7px;
            border-radius: 12px;
            white-space: nowrap;
            flex-shrink: 0;
          }
          .experience-location {
            font-size: 11px;
            color: #64748b;
            margin-top: 4px;
          }
          .empty-day {
            font-size: 12px;
            color: #cbd5e1;
            padding: 8px 12px;
            font-style: italic;
          }

          /* ── Footer ── */
          .footer {
            margin-top: 40px;
            padding-top: 14px;
            border-top: 1px solid #e2e8f0;
            font-size: 11px;
            color: #94a3b8;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="trip-header">
          <div class="trip-title">${escapeHtml(trip.title)}</div>
          <div class="trip-meta">
            <span class="trip-dates">${escapeHtml(dateRange)}</span>
            <span class="trip-count">${datedSections.length} day${datedSections.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        ${orderedSections.map((section, i) => {
          const isUndated = section.title === UNDATED_SENTINEL
          const datedIndex = isUndated ? datedSections.length : i
          return renderSection(section, locale, undatedSectionTitle, datedIndex, isUndated)
        }).join('')}

        <div class="footer">PinGo · ${escapeHtml(trip.title)}</div>
      </body>
    </html>
  `
}
