import { getCurrencySymbol, SUPPORTED_CURRENCIES } from '../currencies'

describe('getCurrencySymbol', () => {
  it('EUR → €', () => {
    expect(getCurrencySymbol('EUR')).toBe('€')
  })

  it('USD → $', () => {
    expect(getCurrencySymbol('USD')).toBe('$')
  })

  it('JPY → ¥', () => {
    expect(getCurrencySymbol('JPY')).toBe('¥')
  })

  it('GBP → £', () => {
    expect(getCurrencySymbol('GBP')).toBe('£')
  })

  it('BRL → R$', () => {
    expect(getCurrencySymbol('BRL')).toBe('R$')
  })

  it('INR → ₹', () => {
    expect(getCurrencySymbol('INR')).toBe('₹')
  })

  it('unknown code falls back to the code itself', () => {
    expect(getCurrencySymbol('XYZ')).toBe('XYZ')
  })

  it('empty string falls back to empty string', () => {
    expect(getCurrencySymbol('')).toBe('')
  })

  it('lowercase code does not match (codes are uppercase only)', () => {
    expect(getCurrencySymbol('eur')).toBe('eur')
  })
})

describe('SUPPORTED_CURRENCIES', () => {
  it('has at least 10 currencies', () => {
    expect(SUPPORTED_CURRENCIES.length).toBeGreaterThanOrEqual(10)
  })

  it('every entry has a defined code', () => {
    SUPPORTED_CURRENCIES.forEach(({ code }) => {
      expect(code).toBeDefined()
      expect(typeof code).toBe('string')
      expect(code.length).toBeGreaterThan(0)
    })
  })

  it('every entry has a defined symbol', () => {
    SUPPORTED_CURRENCIES.forEach(({ symbol }) => {
      expect(symbol).toBeDefined()
      expect(typeof symbol).toBe('string')
      expect(symbol.length).toBeGreaterThan(0)
    })
  })

  it('every entry has a defined name', () => {
    SUPPORTED_CURRENCIES.forEach(({ name }) => {
      expect(name).toBeDefined()
      expect(typeof name).toBe('string')
      expect(name.length).toBeGreaterThan(0)
    })
  })

  it('no duplicate codes', () => {
    const codes = SUPPORTED_CURRENCIES.map((c) => c.code)
    const unique = new Set(codes)
    expect(unique.size).toBe(codes.length)
  })

  it('contains EUR, USD, GBP, JPY', () => {
    const codes = SUPPORTED_CURRENCIES.map((c) => c.code)
    expect(codes).toContain('EUR')
    expect(codes).toContain('USD')
    expect(codes).toContain('GBP')
    expect(codes).toContain('JPY')
  })
})
