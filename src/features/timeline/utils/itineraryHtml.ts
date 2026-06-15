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
      <div class="experience-main">
        <span class="experience-title">${escapeHtml(exp.title)}</span>
        ${timeRange ? `<span class="experience-time">${escapeHtml(timeRange)}</span>` : ''}
      </div>
      ${locationName ? `<div class="experience-location">${escapeHtml(locationName)}</div>` : ''}
    </div>
  `
}

function renderSection(section: Section, locale: string, undatedSectionTitle: string): string {
  const title = section.title === UNDATED_SENTINEL
    ? undatedSectionTitle
    : formatDateWithWeekday(section.title, locale)

  return `
    <div class="section">
      <h2 class="section-title">${escapeHtml(title)}</h2>
      ${section.data.map(exp => renderExperience(exp, locale)).join('')}
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

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          body {
            font-family: -apple-system, Helvetica, Arial, sans-serif;
            color: #0f172a;
            padding: 32px;
          }
          h1 {
            font-size: 24px;
            margin: 0 0 4px;
          }
          .date-range {
            font-size: 14px;
            color: #6366f1;
            font-weight: 600;
            margin: 0 0 24px;
          }
          .section {
            margin-bottom: 20px;
          }
          .section-title {
            font-size: 16px;
            font-weight: 700;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 6px;
            margin: 0 0 10px;
            text-transform: capitalize;
          }
          .experience {
            padding: 8px 0;
            border-bottom: 1px solid #f1f5f9;
          }
          .experience-main {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
          }
          .experience-title {
            font-size: 14px;
            font-weight: 600;
          }
          .experience-time {
            font-size: 12px;
            color: #6366f1;
            font-weight: 600;
            white-space: nowrap;
            margin-left: 12px;
          }
          .experience-location {
            font-size: 12px;
            color: #64748b;
            margin-top: 2px;
          }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(trip.title)}</h1>
        <p class="date-range">${escapeHtml(dateRange)}</p>
        ${sections.map(section => renderSection(section, locale, undatedSectionTitle)).join('')}
      </body>
    </html>
  `
}
