import { describe, expect, it } from 'vitest'

import { calculateForecast, forecastEngineInternals } from './forecastEngine.js'

describe('forecastEngine', () => {
  const baseInput = {
    cutoffId: 10,
    cutoffName: 'June Second Half',
    startDate: '2026-06-16',
    endDate: '2026-06-30',
    asOfDate: '2026-06-20',
    expectedIncome: 30000,
    actualIncome: 25000,
    totalExpenses: 5000,
    totalSavings: 4000,
  }

  describe('core deterministic calculations and invariants', () => {
    it('calculates availableCash from actualIncome minus totalExpenses and totalSavings', () => {
      const result = calculateForecast(baseInput)

      // 25,000 - 5,000 - 4,000 = 16,000
      expect(result.availableCash).toBe(16000)
      expect(result.availableCash).toBe(
        result.actualIncome - result.totalExpenses - result.totalSavings,
      )
    })

    it('proves unreceived expected income does NOT inflate availableCash or safeDailySpend', () => {
      const result = calculateForecast({
        ...baseInput,
        expectedIncome: 100000, // Large planned income not yet received
        actualIncome: 20000,
        totalExpenses: 5000,
        totalSavings: 3000,
      })

      // 20,000 - 5,000 - 3,000 = 12,000
      expect(result.availableCash).toBe(12000)
      expect(result.expectedIncome).toBe(100000)
      // remainingDays = 10, so safeDailySpend is 12000 / 10 = 1200 (not 92000 / 10)
      expect(result.safeDailySpend).toBe(1200)
      expect(result.projectedRemaining).not.toBeGreaterThan(result.availableCash)
    })

    it('conserves days: elapsedDays + remainingDays === totalDays', () => {
      const result = calculateForecast(baseInput)

      // June 16 to June 30 inclusive = 15 days
      expect(result.totalDays).toBe(15)
      // June 16 to June 20 inclusive = 5 days
      expect(result.elapsedDays).toBe(5)
      expect(result.remainingDays).toBe(10)
      expect(result.elapsedDays + result.remainingDays).toBe(result.totalDays)
    })

    it('calculates dailyBurnRate as totalExpenses divided by elapsedDays', () => {
      const result = calculateForecast(baseInput)

      // 5,000 / 5 days = 1,000/day
      expect(result.dailyBurnRate).toBe(1000)
    })

    it('calculates safeDailySpend as availableCash divided by remainingDays when cash is positive', () => {
      const result = calculateForecast(baseInput)

      // 16,000 / 10 days = 1,600/day
      expect(result.safeDailySpend).toBe(1600)
    })

    it('calculates projectedRemaining using unrounded intermediate rate to prevent cent truncation error', () => {
      // Precision regression scenario:
      // totalExpenses = 100 over 3 elapsed days -> rawDailyBurnRate = 33.333333...
      // remainingDays = 3.
      // If intermediate rate were rounded: 33.33 * 3 = 99.99, leaving 0.01 error.
      // With unrounded rate: (100 / 3) * 3 = 100.00, remainingCash = 100 - 100 = 0.
      const precisionInput = {
        cutoffId: 99,
        startDate: '2026-06-01',
        endDate: '2026-06-06', // 6 days total
        asOfDate: '2026-06-03',  // 3 elapsed, 3 remaining
        actualIncome: 200,
        totalExpenses: 100,
        totalSavings: 0,
      }

      const result = calculateForecast(precisionInput)

      expect(result.availableCash).toBe(100)
      expect(result.dailyBurnRate).toBe(33.33) // Public rounded display rate
      expect(result.projectedRemaining).toBe(0) // Exact mathematical projection without 1-cent truncation error
      expect(result.projectedDeficit).toBe(0)
    })

    it('calculates projectedDeficit as abs(projectedRemaining) when projectedRemaining is negative', () => {
      const result = calculateForecast({
        ...baseInput,
        actualIncome: 15000,
        totalExpenses: 10000, // 10,000 / 5 = 2,000/day burn rate
        totalSavings: 2000,
      })

      // availableCash = 15000 - 10000 - 2000 = 3000
      expect(result.availableCash).toBe(3000)
      expect(result.dailyBurnRate).toBe(2000)
      // projectedRemaining = 3000 - (2000 * 10) = -17000
      expect(result.projectedRemaining).toBe(-17000)
      expect(result.projectedDeficit).toBe(17000)
    })

    it('preserves deterministic repeatability for identical inputs', () => {
      const first = calculateForecast(baseInput)
      const second = calculateForecast(baseInput)

      expect(first).toEqual(second)
      expect(JSON.stringify(first)).toBe(JSON.stringify(second))
    })

    it('returns an immutable frozen object', () => {
      const result = calculateForecast(baseInput)

      expect(Object.isFrozen(result)).toBe(true)
      expect(() => {
        result.availableCash = 999999
      }).toThrow()
    })
  })

  describe('edge cases', () => {
    it('handles Day 1 of cutoff (asOfDate === startDate)', () => {
      const result = calculateForecast({
        ...baseInput,
        asOfDate: '2026-06-16',
        totalExpenses: 2500,
      })

      expect(result.elapsedDays).toBe(1)
      expect(result.remainingDays).toBe(14)
      expect(result.totalDays).toBe(15)
      expect(result.dailyBurnRate).toBe(2500)
      // availableCash = 25000 - 2500 - 4000 = 18500
      expect(result.availableCash).toBe(18500)
      // safeDailySpend = 18500 / 14 = 1321.43
      expect(result.safeDailySpend).toBe(1321.43)
    })

    it('handles last day of cutoff (asOfDate === endDate)', () => {
      const result = calculateForecast({
        ...baseInput,
        asOfDate: '2026-06-30',
        totalExpenses: 15000,
      })

      expect(result.elapsedDays).toBe(15)
      expect(result.remainingDays).toBe(0)
      expect(result.totalDays).toBe(15)
      expect(result.dailyBurnRate).toBe(1000)
      expect(result.safeDailySpend).toBe(0)
      // availableCash = 25000 - 15000 - 4000 = 6000
      // remainingDays = 0, so projectedRemaining = availableCash
      expect(result.projectedRemaining).toBe(6000)
      expect(result.projectedDeficit).toBe(0)
    })

    it('handles asOfDate before cutoff start (asOfDate < startDate) using explicit clamp', () => {
      const result = calculateForecast({
        ...baseInput,
        asOfDate: '2026-06-10', // 6 days before start
        totalExpenses: 0,
      })

      expect(result.elapsedDays).toBe(0)
      expect(result.remainingDays).toBe(15)
      expect(result.totalDays).toBe(15)
      expect(result.dailyBurnRate).toBe(0)
      // availableCash = 25000 - 4000 = 21000
      // safeDailySpend = 21000 / 15 = 1400
      expect(result.safeDailySpend).toBe(1400)
      expect(result.projectedRemaining).toBe(21000)
      expect(result.projectedDeficit).toBe(0)
    })

    it('handles asOfDate after cutoff end (asOfDate > endDate) using explicit clamp', () => {
      const result = calculateForecast({
        ...baseInput,
        asOfDate: '2026-07-05', // 5 days after cutoff end
        totalExpenses: 15000,
      })

      expect(result.elapsedDays).toBe(15)
      expect(result.remainingDays).toBe(0)
      expect(result.totalDays).toBe(15)
      expect(result.dailyBurnRate).toBe(1000)
      expect(result.safeDailySpend).toBe(0)
      expect(result.projectedRemaining).toBe(6000)
      expect(result.projectedDeficit).toBe(0)
    })

    it('handles zero income (actualIncome === 0)', () => {
      const result = calculateForecast({
        ...baseInput,
        actualIncome: 0,
        totalExpenses: 3000,
        totalSavings: 1000,
      })

      expect(result.availableCash).toBe(-4000)
      expect(result.safeDailySpend).toBe(0) // availableCash <= 0 gives 0
      // dailyBurnRate = 3000 / 5 = 600
      // projectedRemaining = -4000 - (600 * 10) = -10000
      expect(result.projectedRemaining).toBe(-10000)
      expect(result.projectedDeficit).toBe(10000)
    })

    it('handles zero expenses (totalExpenses === 0)', () => {
      const result = calculateForecast({
        ...baseInput,
        totalExpenses: 0,
      })

      expect(result.dailyBurnRate).toBe(0)
      // availableCash = 25000 - 4000 = 21000
      expect(result.availableCash).toBe(21000)
      expect(result.projectedRemaining).toBe(21000)
      expect(result.projectedDeficit).toBe(0)
    })

    it('handles zero savings (totalSavings === 0)', () => {
      const result = calculateForecast({
        ...baseInput,
        totalSavings: 0,
      })

      expect(result.availableCash).toBe(20000)
      expect(result.projectedRemaining).toBe(10000)
    })

    it('handles all cash saved (actualIncome === totalSavings, totalExpenses === 0)', () => {
      const result = calculateForecast({
        ...baseInput,
        actualIncome: 10000,
        totalExpenses: 0,
        totalSavings: 10000,
      })

      expect(result.availableCash).toBe(0)
      expect(result.dailyBurnRate).toBe(0)
      expect(result.safeDailySpend).toBe(0)
      expect(result.projectedRemaining).toBe(0)
      expect(result.projectedDeficit).toBe(0)
    })

    it('handles negative available cash correctly', () => {
      const result = calculateForecast({
        ...baseInput,
        actualIncome: 5000,
        totalExpenses: 8000,
        totalSavings: 2000,
      })

      // availableCash = 5000 - 8000 - 2000 = -5000
      expect(result.availableCash).toBe(-5000)
      expect(result.safeDailySpend).toBe(0)
      // dailyBurnRate = 8000 / 5 = 1600
      // projectedRemaining = -5000 - (1600 * 10) = -21000
      expect(result.projectedRemaining).toBe(-21000)
      expect(result.projectedDeficit).toBe(21000)
    })

    it('handles cutoff crossing month boundary', () => {
      const result = calculateForecast({
        ...baseInput,
        startDate: '2026-06-25',
        endDate: '2026-07-10',
        asOfDate: '2026-07-02',
      })

      // June 25 to June 30 is 6 days, July 1 to July 10 is 10 days = 16 days total
      expect(result.totalDays).toBe(16)
      // June 25 to July 2 = 6 + 2 = 8 days elapsed
      expect(result.elapsedDays).toBe(8)
      expect(result.remainingDays).toBe(8)
    })

    it('handles cutoff crossing year boundary', () => {
      const result = calculateForecast({
        ...baseInput,
        startDate: '2026-12-25',
        endDate: '2027-01-08',
        asOfDate: '2027-01-02',
      })

      // Dec 25 to Dec 31 = 7 days, Jan 1 to Jan 8 = 8 days = 15 days total
      expect(result.totalDays).toBe(15)
      // Dec 25 to Jan 2 = 7 + 2 = 9 days elapsed
      expect(result.elapsedDays).toBe(9)
      expect(result.remainingDays).toBe(6)
    })

    it('handles leap-day cutoff accurately', () => {
      const result = calculateForecast({
        ...baseInput,
        startDate: '2028-02-20',
        endDate: '2028-03-05',
        asOfDate: '2028-02-29', // Leap day
      })

      // 2028 is leap year: Feb 20 to Feb 29 = 10 days, March 1 to March 5 = 5 days = 15 days
      expect(result.totalDays).toBe(15)
      expect(result.elapsedDays).toBe(10)
      expect(result.remainingDays).toBe(5)
    })

    it('maintains 2 decimal places precision for currency amounts', () => {
      const result = calculateForecast({
        ...baseInput,
        actualIncome: 20000.33,
        totalExpenses: 7000.77,
        totalSavings: 3000.22,
      })

      // 20000.33 - 7000.77 - 3000.22 = 9999.34
      expect(result.availableCash).toBe(9999.34)
      // dailyBurnRate = 7000.77 / 5 = 1400.154 -> 1400.15
      expect(result.dailyBurnRate).toBe(1400.15)
      // safeDailySpend = 9999.34 / 10 = 999.934 -> 999.93
      expect(result.safeDailySpend).toBe(999.93)
      // projectedRemaining uses unrounded rate: 9999.34 - (7000.77 / 5 * 10) = 9999.34 - 14001.54 = -4002.20
      expect(result.projectedRemaining).toBe(-4002.2)
      expect(result.projectedDeficit).toBe(4002.2)
    })

    it('handles very large finite monetary values without overflow', () => {
      const result = calculateForecast({
        ...baseInput,
        actualIncome: 50000000,
        totalExpenses: 15000000,
        totalSavings: 10000000,
      })

      expect(result.availableCash).toBe(25000000)
      expect(result.dailyBurnRate).toBe(3000000)
      expect(result.safeDailySpend).toBe(2500000)
      expect(result.projectedRemaining).toBe(-5000000)
      expect(result.projectedDeficit).toBe(5000000)
    })

    it('normalizes -0 to 0 in roundMoney', () => {
      const result = forecastEngineInternals.roundMoney(-0)
      expect(Object.is(result, 0)).toBe(true)
      expect(Object.is(result, -0)).toBe(false)
    })

    it('handles missing/omitted monetary inputs by defaulting safely to zero', () => {
      const minimalInput = {
        cutoffId: 1,
        startDate: '2026-06-01',
        endDate: '2026-06-15',
        asOfDate: '2026-06-05',
      }

      const result = calculateForecast(minimalInput)

      expect(result.actualIncome).toBe(0)
      expect(result.expectedIncome).toBe(0)
      expect(result.totalExpenses).toBe(0)
      expect(result.totalSavings).toBe(0)
      expect(result.availableCash).toBe(0)
      expect(result.dailyBurnRate).toBe(0)
      expect(result.safeDailySpend).toBe(0)
      expect(result.projectedRemaining).toBe(0)
    })
  })

  describe('validation errors and non-finite money rejection', () => {
    it('throws predictable error when actualIncome is NaN', () => {
      expect(() =>
        calculateForecast({
          ...baseInput,
          actualIncome: NaN,
        }),
      ).toThrow('Forecast input "actualIncome" must be a finite number, received: NaN')
    })

    it('throws predictable error when totalExpenses is Infinity', () => {
      expect(() =>
        calculateForecast({
          ...baseInput,
          totalExpenses: Infinity,
        }),
      ).toThrow('Forecast input "totalExpenses" must be a finite number, received: Infinity')
    })

    it('throws predictable error when totalSavings is -Infinity', () => {
      expect(() =>
        calculateForecast({
          ...baseInput,
          totalSavings: -Infinity,
        }),
      ).toThrow('Forecast input "totalSavings" must be a finite number, received: -Infinity')
    })

    it('throws error when cutoffId is missing', () => {
      expect(() =>
        calculateForecast({
          ...baseInput,
          cutoffId: null,
        }),
      ).toThrow('valid cutoffId')
    })

    it('throws error on invalid date strings', () => {
      expect(() =>
        calculateForecast({
          ...baseInput,
          startDate: 'invalid-date',
        }),
      ).toThrow('Invalid ISO date string')
    })

    it('throws error when startDate is after endDate', () => {
      expect(() =>
        calculateForecast({
          ...baseInput,
          startDate: '2026-06-30',
          endDate: '2026-06-15',
        }),
      ).toThrow('startDate (2026-06-30) must be on or before endDate (2026-06-15)')
    })
  })
})
