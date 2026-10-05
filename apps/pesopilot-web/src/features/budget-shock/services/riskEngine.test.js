import { describe, expect, it } from 'vitest'

import {
  RISK_LEVELS,
  RISK_SCORES,
  RISK_SIGNAL_CODES,
} from '../constants/budgetShockConstants.js'
import { calculateRisk, riskEngine } from './riskEngine.js'

describe('riskEngine', () => {
  const baseForecast = {
    cutoffId: 10,
    cutoffName: 'June Second Half',
    startDate: '2026-06-16',
    endDate: '2026-06-30',
    asOfDate: '2026-06-20',
    totalDays: 15,
    elapsedDays: 5,
    remainingDays: 10,
    expectedIncome: 30000,
    actualIncome: 30000,
    totalExpenses: 5000,
    totalSavings: 5000,
    availableCash: 20000,
    dailyBurnRate: 500, // 500 / 2000 = 25% -> Green
    safeDailySpend: 2000,
    projectedRemaining: 15000,
    projectedDeficit: 0,
  }

  describe('GREEN — Healthy', () => {
    it('exposes calculateRisk on riskEngine singleton', () => {
      expect(riskEngine.calculateRisk).toBe(calculateRisk)
    })

    it('evaluates Green (score 0) when burn ratio <= 0.90, no deficit, and all budgets < 70%', () => {
      const result = calculateRisk(baseForecast, [
        { categoryId: 1, plannedAmount: 1000, spentAmountSnapshot: 500 }, // 50%
      ])

      expect(result.level).toBe(RISK_LEVELS.green)
      expect(result.score).toBe(RISK_SCORES.green)
      expect(result.score).toBe(0)
      expect(result.primaryReasonCode).toBeNull()
      expect(result.causeCategoryId).toBeNull()
      expect(result.projectedDeficit).toBe(0)
      expect(Object.isFrozen(result)).toBe(true)
    })

    it('evaluates Green when burn ratio is exactly 90.00% (burn = 90, safe = 100)', () => {
      const forecast = {
        ...baseForecast,
        dailyBurnRate: 90,
        safeDailySpend: 100,
        availableCash: 1000,
        projectedRemaining: 100,
        projectedDeficit: 0,
      }

      const result = calculateRisk(forecast)
      expect(result.level).toBe(RISK_LEVELS.green)
      expect(result.score).toBe(0)
    })

    it('evaluates Green when budget is exactly 69.99%', () => {
      const result = calculateRisk(baseForecast, [
        { categoryId: 1, plannedAmount: 10000, spentAmountSnapshot: 6999 }, // 69.99%
      ])
      expect(result.level).toBe(RISK_LEVELS.green)
    })
  })

  describe('YELLOW — Monitor Spending', () => {
    it('evaluates Yellow (score 1) when burn ratio is just above 90.00% (90.01 / 100)', () => {
      const forecast = {
        ...baseForecast,
        dailyBurnRate: 90.01,
        safeDailySpend: 100,
        availableCash: 1000,
        projectedRemaining: 99.9,
        projectedDeficit: 0,
      }

      const result = calculateRisk(forecast)
      expect(result.level).toBe(RISK_LEVELS.yellow)
      expect(result.score).toBe(RISK_SCORES.yellow)
      expect(result.score).toBe(1)
      expect(result.primaryReasonCode).toBe(RISK_SIGNAL_CODES.BURN_NEAR_SAFE)
    })

    it('evaluates Yellow when burn ratio is exactly 100.00% (burn = 100, safe = 100)', () => {
      const forecast = {
        ...baseForecast,
        dailyBurnRate: 100,
        safeDailySpend: 100,
        availableCash: 1000,
        projectedRemaining: 0,
        projectedDeficit: 0,
      }

      const result = calculateRisk(forecast)
      expect(result.level).toBe(RISK_LEVELS.yellow)
      expect(result.score).toBe(1)
      expect(result.primaryReasonCode).toBe(RISK_SIGNAL_CODES.BURN_NEAR_SAFE)
    })

    it('evaluates Yellow when category budget utilization is exactly 70.00%', () => {
      const result = calculateRisk(baseForecast, [
        { categoryId: 42, plannedAmount: 1000, spentAmountSnapshot: 700 }, // 70.00%
      ])

      expect(result.level).toBe(RISK_LEVELS.yellow)
      expect(result.score).toBe(1)
      expect(result.primaryReasonCode).toBe(RISK_SIGNAL_CODES.CATEGORY_BUDGET_WATCH)
      expect(result.causeCategoryId).toBe(42)
    })

    it('evaluates Yellow when category budget utilization is 79.99%', () => {
      const result = calculateRisk(baseForecast, [
        { categoryId: 42, plannedAmount: 10000, spentAmountSnapshot: 7999 }, // 79.99%
      ])

      expect(result.level).toBe(RISK_LEVELS.yellow)
      expect(result.primaryReasonCode).toBe(RISK_SIGNAL_CODES.CATEGORY_BUDGET_WATCH)
    })
  })

  describe('ORANGE — Likely Overspending', () => {
    it('evaluates Orange (score 2) when dailyBurnRate > safeDailySpend (100.01 vs 100)', () => {
      const forecast = {
        ...baseForecast,
        dailyBurnRate: 100.01,
        safeDailySpend: 100,
        availableCash: 1000,
        projectedRemaining: 10, // Not negative yet
        projectedDeficit: 0,
      }

      const result = calculateRisk(forecast)
      expect(result.level).toBe(RISK_LEVELS.orange)
      expect(result.score).toBe(RISK_SCORES.orange)
      expect(result.score).toBe(2)
      expect(result.primaryReasonCode).toBe(RISK_SIGNAL_CODES.BURN_EXCEEDS_SAFE)
    })

    it('does NOT trigger Orange solely from burn if burnRatio === 1.0000', () => {
      const forecast = {
        ...baseForecast,
        dailyBurnRate: 100,
        safeDailySpend: 100,
        availableCash: 1000,
        projectedRemaining: 0,
        projectedDeficit: 0,
      }

      const result = calculateRisk(forecast)
      expect(result.level).toBe(RISK_LEVELS.yellow) // 1.0000 is Yellow, not Orange
    })

    it('evaluates Orange when category budget utilization is exactly 80.00%', () => {
      const result = calculateRisk(baseForecast, [
        { categoryId: 7, plannedAmount: 1000, spentAmountSnapshot: 800 }, // 80.00%
      ])

      expect(result.level).toBe(RISK_LEVELS.orange)
      expect(result.score).toBe(2)
      expect(result.primaryReasonCode).toBe(RISK_SIGNAL_CODES.CATEGORY_BUDGET_WARNING)
      expect(result.causeCategoryId).toBe(7)
    })

    it('evaluates Orange when category budget utilization is exactly 100.00% (fully consumed)', () => {
      const result = calculateRisk(baseForecast, [
        { categoryId: 9, plannedAmount: 1000, spentAmountSnapshot: 1000 }, // 100.00%
      ])

      expect(result.level).toBe(RISK_LEVELS.orange)
      expect(result.score).toBe(2)
      expect(result.primaryReasonCode).toBe(RISK_SIGNAL_CODES.CATEGORY_BUDGET_WARNING)
    })
  })

  describe('RED — Projected Deficit / Budget Overage', () => {
    it('does NOT trigger Red when projectedRemaining is +0.01 and projectedDeficit is 0', () => {
      const forecast = {
        ...baseForecast,
        projectedRemaining: 0.01,
        projectedDeficit: 0,
      }

      const result = calculateRisk(forecast)
      expect(result.level).not.toBe(RISK_LEVELS.red)
    })

    it('does NOT trigger Red solely because projectedRemaining is exactly 0', () => {
      const forecast = {
        ...baseForecast,
        projectedRemaining: 0,
        projectedDeficit: 0,
      }

      const result = calculateRisk(forecast)
      expect(result.level).not.toBe(RISK_LEVELS.red)
    })

    it('evaluates Red (score 3) when projectedDeficit > 0 and projectedRemaining = -0.01', () => {
      const forecast = {
        ...baseForecast,
        projectedRemaining: -0.01,
        projectedDeficit: 0.01,
      }

      const result = calculateRisk(forecast)
      expect(result.level).toBe(RISK_LEVELS.red)
      expect(result.score).toBe(RISK_SCORES.red)
      expect(result.score).toBe(3)
      expect(result.primaryReasonCode).toBe(RISK_SIGNAL_CODES.PROJECTED_DEFICIT)
      expect(result.projectedDeficit).toBe(0.01)
    })

    it('evaluates Red when availableCash is negative (-0.01)', () => {
      const forecast = {
        ...baseForecast,
        availableCash: -0.01,
        projectedRemaining: 0,
        projectedDeficit: 0,
      }

      const result = calculateRisk(forecast)
      expect(result.level).toBe(RISK_LEVELS.red)
      expect(result.score).toBe(3)
      expect(result.primaryReasonCode).toBe(RISK_SIGNAL_CODES.NEGATIVE_AVAILABLE_CASH)
    })

    it('evaluates Red when category budget utilization is 100.01% (100.01 / 100)', () => {
      const result = calculateRisk(baseForecast, [
        { categoryId: 15, plannedAmount: 10000, spentAmountSnapshot: 10001 }, // 100.01%
      ])

      expect(result.level).toBe(RISK_LEVELS.red)
      expect(result.score).toBe(3)
      expect(result.primaryReasonCode).toBe(RISK_SIGNAL_CODES.CATEGORY_OVER_BUDGET)
      expect(result.causeCategoryId).toBe(15)
    })
  })

  describe('Severity Precedence Ordering', () => {
    it('prioritizes Red over Orange and Yellow', () => {
      // Orange burn ratio (1.10) + Red budget overage (101%)
      const forecast = {
        ...baseForecast,
        dailyBurnRate: 110,
        safeDailySpend: 100,
      }
      const budgets = [
        { categoryId: 1, plannedAmount: 100, spentAmountSnapshot: 101 }, // Red
      ]

      const result = calculateRisk(forecast, budgets)
      expect(result.level).toBe(RISK_LEVELS.red)
      expect(result.score).toBe(3)
      expect(result.primaryReasonCode).toBe(RISK_SIGNAL_CODES.CATEGORY_OVER_BUDGET)
    })

    it('prioritizes Orange over Yellow', () => {
      // Yellow budget (75%) + Orange burn ratio (1.05)
      const forecast = {
        ...baseForecast,
        dailyBurnRate: 105,
        safeDailySpend: 100,
      }
      const budgets = [
        { categoryId: 1, plannedAmount: 100, spentAmountSnapshot: 75 }, // Yellow
      ]

      const result = calculateRisk(forecast, budgets)
      expect(result.level).toBe(RISK_LEVELS.orange)
      expect(result.score).toBe(2)
      expect(result.primaryReasonCode).toBe(RISK_SIGNAL_CODES.BURN_EXCEEDS_SAFE)
    })

    it('prioritizes PROJECTED_DEFICIT over NEGATIVE_AVAILABLE_CASH and CATEGORY_OVER_BUDGET', () => {
      const forecast = {
        ...baseForecast,
        availableCash: -100,
        projectedRemaining: -500,
        projectedDeficit: 500,
      }
      const budgets = [
        { categoryId: 2, plannedAmount: 100, spentAmountSnapshot: 120 },
      ]

      const result = calculateRisk(forecast, budgets)
      expect(result.level).toBe(RISK_LEVELS.red)
      expect(result.primaryReasonCode).toBe(RISK_SIGNAL_CODES.PROJECTED_DEFICIT)
    })
  })

  describe('Edge Cases & Optional Budgets', () => {
    it('operates cleanly when budgets array is empty (no category budgets)', () => {
      const greenResult = calculateRisk(baseForecast, [])
      expect(greenResult.level).toBe(RISK_LEVELS.green)

      const redForecast = {
        ...baseForecast,
        projectedDeficit: 1500,
        projectedRemaining: -1500,
      }
      const redResult = calculateRisk(redForecast, [])
      expect(redResult.level).toBe(RISK_LEVELS.red)
      expect(redResult.projectedDeficit).toBe(1500)
    })

    it('handles remainingDays = 0 gracefully without burn ratio calculation', () => {
      const forecast = {
        ...baseForecast,
        remainingDays: 0,
        safeDailySpend: 0,
        dailyBurnRate: 1000,
        availableCash: 500,
        projectedRemaining: 500,
        projectedDeficit: 0,
      }

      const result = calculateRisk(forecast)
      expect(result.level).toBe(RISK_LEVELS.green) // No overspending or deficit
    })

    it('handles safeDailySpend = 0 with projectedDeficit > 0 without division by zero', () => {
      const forecast = {
        ...baseForecast,
        remainingDays: 5,
        safeDailySpend: 0,
        availableCash: 0,
        dailyBurnRate: 500,
        projectedRemaining: -2500,
        projectedDeficit: 2500,
      }

      const result = calculateRisk(forecast)
      expect(result.level).toBe(RISK_LEVELS.red)
      expect(result.primaryReasonCode).toBe(RISK_SIGNAL_CODES.PROJECTED_DEFICIT)
      expect(result.projectedDeficit).toBe(2500)
    })

    it('ignores budgets where plannedAmount <= 0', () => {
      const budgets = [
        { categoryId: 1, plannedAmount: 0, spentAmountSnapshot: 100 },
        { categoryId: 2, plannedAmount: -50, spentAmountSnapshot: 10 },
      ]

      const result = calculateRisk(baseForecast, budgets)
      expect(result.level).toBe(RISK_LEVELS.green)
    })

    it('picks the category budget with highest utilization when multiple categories match same code', () => {
      const budgets = [
        { categoryId: 1, plannedAmount: 100, spentAmountSnapshot: 82 }, // 82%
        { categoryId: 2, plannedAmount: 100, spentAmountSnapshot: 95 }, // 95%
      ]

      const result = calculateRisk(baseForecast, budgets)
      expect(result.level).toBe(RISK_LEVELS.orange)
      expect(result.causeCategoryId).toBe(2) // 95% has higher utilization than 82%
    })

    it('breaks ties deterministically by categoryId when multiple categories have identical utilization', () => {
      const budgets = [
        { categoryId: 'cat-b', plannedAmount: 100, spentAmountSnapshot: 85 }, // 85%
        { categoryId: 'cat-a', plannedAmount: 100, spentAmountSnapshot: 85 }, // 85%
      ]

      const result = calculateRisk(baseForecast, budgets)
      expect(result.level).toBe(RISK_LEVELS.orange)
      expect(result.causeCategoryId).toBe('cat-a') // 'cat-a' precedes 'cat-b'
    })

    it('safely ignores budgets with NaN or non-finite numbers', () => {
      const budgets = [
        { categoryId: 1, plannedAmount: NaN, spentAmountSnapshot: 100 },
        { categoryId: 2, plannedAmount: Infinity, spentAmountSnapshot: 100 },
        { categoryId: 3, plannedAmount: 100, spentAmountSnapshot: NaN },
        { categoryId: 4, plannedAmount: 100, spentAmountSnapshot: Infinity },
      ]

      const result = calculateRisk(baseForecast, budgets)
      expect(result.level).toBe(RISK_LEVELS.green)
    })

    it('ensures deep immutability of RiskResult and its nested signals', () => {
      const budgets = [
        { categoryId: 1, plannedAmount: 100, spentAmountSnapshot: 85 },
      ]

      const result = calculateRisk(baseForecast, budgets)
      expect(Object.isFrozen(result)).toBe(true)
      expect(Object.isFrozen(result.signals)).toBe(true)
      expect(result.signals.length).toBeGreaterThan(0)
      expect(Object.isFrozen(result.signals[0])).toBe(true)

      expect(() => {
        result.level = RISK_LEVELS.red
      }).toThrow()

      expect(() => {
        result.signals.push({ code: 'MUTATION' })
      }).toThrow()

      expect(() => {
        result.signals[0].code = 'MUTATION'
      }).toThrow()
    })
  })
})
