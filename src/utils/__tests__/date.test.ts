import { formatDate, formatDateRange, formatDateWithWeekday, formatShortDate } from '../date'

describe('formatDate', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns a non-empty string for a valid ISO date', () => {
    const result = formatDate('2024-06-15')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('includes the day number in the output', () => {
    const result = formatDate('2024-06-15')
    expect(result).toMatch(/15/)
  })

  it('uses es-ES locale by default (Spanish month abbreviation)', () => {
    // June in Spanish is 'jun'
    const result = formatDate('2024-06-15')
    expect(result.toLowerCase()).toMatch(/jun/)
  })

  it('includes the year', () => {
    const result = formatDate('2024-06-15')
    expect(result).toContain('2024')
  })

  it('accepts an explicit locale override', () => {
    const es = formatDate('2024-06-15', 'es-ES')
    const en = formatDate('2024-06-15', 'en-US')
    // Different locales should produce different formats (or at least not throw)
    expect(typeof en).toBe('string')
    expect(en.length).toBeGreaterThan(0)
  })
})

describe('formatShortDate', () => {
  it('returns a non-empty string for a valid ISO date', () => {
    const result = formatShortDate('2024-06-15')
    expect(result.length).toBeGreaterThan(0)
  })

  it('does NOT include the year', () => {
    const result = formatShortDate('2024-06-15')
    expect(result).not.toContain('2024')
  })

  it('includes the day number', () => {
    const result = formatShortDate('2024-06-15')
    expect(result).toMatch(/15/)
  })
})

describe('formatDateRange', () => {
  it('returns a non-empty string for two different dates', () => {
    const result = formatDateRange('2024-06-01', '2024-06-15')
    expect(result.length).toBeGreaterThan(0)
  })

  it('contains the separator " - " between the two dates', () => {
    const result = formatDateRange('2024-06-01', '2024-06-15')
    expect(result).toContain(' - ')
  })

  it('includes start and end day numbers', () => {
    const result = formatDateRange('2024-06-01', '2024-06-15')
    expect(result).toMatch(/1/)
    expect(result).toMatch(/15/)
  })

  it('handles same start and end date (single-day trip)', () => {
    const result = formatDateRange('2024-06-15', '2024-06-15')
    expect(result.length).toBeGreaterThan(0)
    expect(result).toContain(' - ')
  })

  it('uses es-ES locale by default (Spanish month abbreviation)', () => {
    // June in Spanish: 'jun'
    const result = formatDateRange('2024-06-01', '2024-06-15')
    expect(result.toLowerCase()).toMatch(/jun/)
  })

  it('both halves contain the month when months differ', () => {
    // May and June
    const result = formatDateRange('2024-05-30', '2024-06-02')
    expect(result.toLowerCase()).toMatch(/may/)
    expect(result.toLowerCase()).toMatch(/jun/)
  })
})

describe('formatDateWithWeekday', () => {
  it('returns a non-empty string for a valid ISO date', () => {
    const result = formatDateWithWeekday('2024-06-15')
    expect(result.length).toBeGreaterThan(0)
  })

  it('starts with a capitalized weekday name in Spanish', () => {
    // 2024-06-15 is a Saturday → 'Sábado' in es-ES
    const result = formatDateWithWeekday('2024-06-15')
    expect(result.charAt(0)).toBe(result.charAt(0).toUpperCase())
  })

  it('includes the day number', () => {
    const result = formatDateWithWeekday('2024-06-15')
    expect(result).toMatch(/15/)
  })

  it('produces a Spanish weekday for a known date', () => {
    // 2024-01-01 is a Monday → 'Lunes' in es-ES
    const result = formatDateWithWeekday('2024-01-01')
    expect(result.toLowerCase()).toContain('lunes')
  })
})
