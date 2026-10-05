import { describe, expect, it } from 'vitest'

import { generateForecastExplanation } from './forecastExplanationService.js'

describe('forecastExplanationService', () => {
  const baseForecast = {
    version: '1.0.0',
    cutoffId: 10,
    cutoffName: 'June Second Half',
    startDate: '2026-06-16',
    endDate: '2026-06-30',
    asOfDate: '2026-06-20',
    totalDays: 15,
    elapsedDays: 5,
    remainingDays: 10,
    expectedIncome: 30000,
    actualIncome: 25000,
    totalExpenses: 5000,
    totalSavings: 4000,
    availableCash: 16000,
    dailyBurnRate: 1000,
    safeDailySpend: 1600,
    projectedRemaining: 6000,
    projectedDeficit: 0,
  }

  it('generates a factual narrative for positive projected remaining cash', () => {
    const explanation = generateForecastExplanation(baseForecast)

    expect(explanation.headline).toContain('Projected remaining cash at cutoff end')
    expect(explanation.headline).toContain('6,000.00')
    expect(explanation.summary).toContain('1,000.00/day')
    expect(explanation.summary).toContain('6,000.00')
    expect(explanation.details).toHaveLength(3)
    expect(explanation.details[0]).toContain('16,000.00')
    expect(explanation.details[0]).toContain('10 remaining days')
    expect(explanation.details[1]).toContain('1,600.00/day')
  })

  it('generates a factual narrative for projected shortfall without alarmist terminology', () => {
    const deficitForecast = {
      ...baseForecast,
      actualIncome: 15000,
      totalExpenses: 10000,
      totalSavings: 2000,
      availableCash: 3000,
      dailyBurnRate: 2000,
      safeDailySpend: 300,
      projectedRemaining: -17000,
      projectedDeficit: 17000,
    }

    const explanation = generateForecastExplanation(deficitForecast)

    expect(explanation.headline).toContain('Projected shortfall of')
    expect(explanation.headline).toContain('17,000.00')
    expect(explanation.summary).toContain('2,000.00/day')
    expect(explanation.summary).toContain('-₱17,000.00')
    expect(explanation.details[1]).toContain('300.00/day')

    // Verify non-alarmist Phase 12 wording
    const fullText = `${explanation.headline} ${explanation.summary} ${explanation.details.join(' ')}`
    expect(fullText).not.toMatch(/danger/i)
    expect(fullText).not.toMatch(/critical/i)
    expect(fullText).not.toMatch(/shock/i)
    expect(fullText).not.toMatch(/emergency/i)
    expect(fullText).not.toMatch(/red alert/i)
  })

  it('handles Day 1 with zero expenses gracefully', () => {
    const dayOneForecast = {
      ...baseForecast,
      asOfDate: '2026-06-16',
      elapsedDays: 1,
      remainingDays: 14,
      totalExpenses: 0,
      availableCash: 21000,
      dailyBurnRate: 0,
      safeDailySpend: 1500,
      projectedRemaining: 21000,
      projectedDeficit: 0,
    }

    const explanation = generateForecastExplanation(dayOneForecast)

    expect(explanation.summary).toContain('No expenses have been recorded yet')
    expect(explanation.summary).toContain('1,500.00/day')
    expect(explanation.details[1]).toContain('1,500.00/day')
  })

  it('handles completed cutoff when remainingDays is 0', () => {
    const completedForecast = {
      ...baseForecast,
      asOfDate: '2026-06-30',
      elapsedDays: 15,
      remainingDays: 0,
      totalExpenses: 15000,
      availableCash: 6000,
      dailyBurnRate: 1000,
      safeDailySpend: 0,
      projectedRemaining: 6000,
      projectedDeficit: 0,
    }

    const explanation = generateForecastExplanation(completedForecast)

    expect(explanation.headline).toContain('Cutoff complete')
    expect(explanation.headline).toContain('6,000.00')
    expect(explanation.summary).toContain('cycle ended on 2026-06-30')
    expect(explanation.details[0]).toContain('15,000.00 across 15 days')
    expect(explanation.details[1]).toContain('1,000.00/day')
  })

  it('throws when input is invalid or missing', () => {
    expect(() => generateForecastExplanation(null)).toThrow('valid forecast object')
  })
})
