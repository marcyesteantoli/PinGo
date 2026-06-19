import { formatCurrency, splitEqually, splitEquallyAll } from '../currency'

describe('splitEqually', () => {
  beforeEach(() => jest.clearAllMocks())

  it('splits 10 evenly between 2 participants', () => {
    expect(splitEqually(10, 2, 0)).toBe(5)
    expect(splitEqually(10, 2, 1)).toBe(5)
  })

  it('splits 10 evenly between 3: index 0 gets the cent remainder', () => {
    // 10 / 3 = 3.33... → baseCents = 333, remainder = 1
    // index 0: (333 + 1) / 100 = 3.34
    // index 1: 333 / 100 = 3.33
    // index 2: 333 / 100 = 3.33
    expect(splitEqually(10, 3, 0)).toBe(3.34)
    expect(splitEqually(10, 3, 1)).toBe(3.33)
    expect(splitEqually(10, 3, 2)).toBe(3.33)
  })

  it('sum of all splits equals total exactly (no rounding loss)', () => {
    const total = 10
    const count = 3
    const parts = Array.from({ length: count }, (_, i) => splitEqually(total, count, i))
    const sum = parts.reduce((a, b) => Math.round((a + b) * 100) / 100, 0)
    expect(sum).toBe(total)
  })

  it('works for a single participant (index 0, count 1)', () => {
    expect(splitEqually(25, 1, 0)).toBe(25)
  })

  it('default index is 0 (gets the remainder)', () => {
    // Calling without index should behave the same as index 0
    expect(splitEqually(10, 3)).toBe(splitEqually(10, 3, 0))
  })
})

describe('splitEquallyAll', () => {
  it('splits 30 equally among 3 participants', () => {
    const result = splitEquallyAll(30, ['A', 'B', 'C'])
    expect(result).toHaveLength(3)
    result.forEach((r) => expect(r.amount).toBe(10))
  })

  it('sum of all returned amounts equals total exactly', () => {
    const total = 10
    const result = splitEquallyAll(total, ['A', 'B', 'C'])
    const sum = result.reduce((acc, r) => Math.round((acc + r.amount) * 100) / 100, 0)
    expect(sum).toBe(total)
  })

  it('assigns the cent remainder to the first participant (index 0)', () => {
    // 10 / 3 → first gets 3.34, rest get 3.33
    const result = splitEquallyAll(10, ['A', 'B', 'C'])
    expect(result[0].amount).toBe(3.34)
    expect(result[1].amount).toBe(3.33)
    expect(result[2].amount).toBe(3.33)
  })

  it('preserves participant IDs in userId field', () => {
    const result = splitEquallyAll(30, ['alice', 'bob', 'carol'])
    expect(result.map((r) => r.userId)).toEqual(['alice', 'bob', 'carol'])
  })

  it('works for a single participant', () => {
    const result = splitEquallyAll(99.99, ['solo'])
    expect(result).toHaveLength(1)
    expect(result[0].userId).toBe('solo')
    expect(result[0].amount).toBe(99.99)
  })
})

describe('formatCurrency', () => {
  it('formats a number with EUR currency symbol', () => {
    const formatted = formatCurrency(1000, 'EUR')
    // Should contain the Euro sign and the number
    expect(formatted).toContain('1')
    expect(formatted).toContain('000')
    // es-ES locale formats EUR with the symbol
    expect(formatted).toMatch(/€|EUR/)
  })

  it('defaults to EUR when no currency is provided', () => {
    const withEur = formatCurrency(50, 'EUR')
    const withDefault = formatCurrency(50)
    expect(withDefault).toBe(withEur)
  })

  it('formats zero correctly', () => {
    const formatted = formatCurrency(0, 'EUR')
    expect(formatted).toContain('0')
  })

  it('formats decimal amounts', () => {
    const formatted = formatCurrency(9.99, 'EUR')
    // Should contain both digits of the decimal amount
    expect(formatted).toContain('9')
    expect(formatted).toContain('99')
  })

  it('returns a non-empty string for valid inputs', () => {
    expect(formatCurrency(42, 'EUR').length).toBeGreaterThan(0)
  })
})
