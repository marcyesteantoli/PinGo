import { getExpenseCategory } from '../getExpenseCategory'

describe('getExpenseCategory', () => {
  describe('English keywords', () => {
    it('dinner → restaurant', () => {
      expect(getExpenseCategory('dinner')).toBe('restaurant')
    })

    it('lunch → restaurant', () => {
      expect(getExpenseCategory('lunch')).toBe('restaurant')
    })

    it('uber → transport', () => {
      expect(getExpenseCategory('uber')).toBe('transport')
    })

    it('flight → transport', () => {
      expect(getExpenseCategory('flight')).toBe('transport')
    })

    it('hotel → accommodation', () => {
      expect(getExpenseCategory('hotel')).toBe('accommodation')
    })

    it('airbnb → accommodation', () => {
      expect(getExpenseCategory('airbnb')).toBe('accommodation')
    })

    it('museum → activity', () => {
      expect(getExpenseCategory('museum')).toBe('activity')
    })

    it('cinema → entertainment', () => {
      expect(getExpenseCategory('cinema')).toBe('entertainment')
    })
  })

  describe('Spanish keywords', () => {
    it('cena → restaurant', () => {
      expect(getExpenseCategory('cena')).toBe('restaurant')
    })

    it('restaurante → restaurant', () => {
      expect(getExpenseCategory('restaurante')).toBe('restaurant')
    })

    it('taxi → transport', () => {
      expect(getExpenseCategory('taxi')).toBe('transport')
    })

    it('billete → transport', () => {
      expect(getExpenseCategory('billete de tren')).toBe('transport')
    })

    it('alojamiento → accommodation', () => {
      expect(getExpenseCategory('alojamiento')).toBe('accommodation')
    })

    it('apartamento → accommodation', () => {
      expect(getExpenseCategory('apartamento en el centro')).toBe('accommodation')
    })

    it('museo → activity', () => {
      expect(getExpenseCategory('museo de arte')).toBe('activity')
    })

    it('cine → entertainment', () => {
      expect(getExpenseCategory('cine')).toBe('entertainment')
    })
  })

  describe('Case-insensitive matching', () => {
    it('DINNER equals dinner', () => {
      expect(getExpenseCategory('DINNER')).toBe('restaurant')
    })

    it('HOTEL equals hotel', () => {
      expect(getExpenseCategory('HOTEL')).toBe('accommodation')
    })

    it('Uber (mixed case) equals uber', () => {
      expect(getExpenseCategory('Uber ride')).toBe('transport')
    })

    it('MUSEUM equals museum', () => {
      expect(getExpenseCategory('MUSEUM entrance')).toBe('activity')
    })
  })

  describe('experienceType override', () => {
    it('returns experienceType when provided, ignoring description keywords', () => {
      expect(getExpenseCategory('dinner for everyone', 'transport')).toBe('transport')
    })

    it('returns experienceType even if it would not match by description', () => {
      expect(getExpenseCategory('random text', 'entertainment')).toBe('entertainment')
    })

    it('returns experienceType when description is empty', () => {
      expect(getExpenseCategory('', 'activity')).toBe('activity')
    })

    it('does NOT use experienceType when it is null', () => {
      expect(getExpenseCategory('hotel room', null)).toBe('accommodation')
    })

    it('does NOT use experienceType when it is undefined', () => {
      expect(getExpenseCategory('dinner', undefined)).toBe('restaurant')
    })
  })

  describe('Fallback to other', () => {
    it('unknown text → other', () => {
      expect(getExpenseCategory('miscellaneous purchase')).toBe('other')
    })

    it('empty string → other', () => {
      expect(getExpenseCategory('')).toBe('other')
    })

    it('whitespace only → other', () => {
      expect(getExpenseCategory('   ')).toBe('other')
    })

    it('numbers only → other', () => {
      expect(getExpenseCategory('12345')).toBe('other')
    })
  })
})
