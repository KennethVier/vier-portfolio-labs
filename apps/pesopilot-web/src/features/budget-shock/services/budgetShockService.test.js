import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RISK_LEVELS } from '../constants/budgetShockConstants.js'
import { budgetShockService } from './budgetShockService.js'

vi.mock('@/features/cashflow/services/cashflowService.js', () => ({
  cashflowService: {
    calculateForecastForCutoff: vi.fn(),
  },
}))

vi.mock('@/features/salary-cutoff/services/cutoffService.js', () => ({
  cutoffService: {
    findCurrentCutoff: vi.fn(),
  },
}))

vi.mock('@/lib/db/repositories/budgetRepository.js', () => ({
  budgetRepository: {
    findByCutoff: vi.fn(),
  },
}))

vi.mock('./budgetShockAlertService.js', () => ({
  budgetShockAlertService: {
    synchronizeAlert: vi.fn(),
  },
}))

import { cashflowService } from '@/features/cashflow/services/cashflowService.js'
import { cutoffService } from '@/features/salary-cutoff/services/cutoffService.js'
import { budgetRepository } from '@/lib/db/repositories/budgetRepository.js'
import { budgetShockAlertService } from './budgetShockAlertService.js'

describe('budgetShockService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty result when no cutoff is active', async () => {
    cutoffService.findCurrentCutoff.mockResolvedValue(null)

    const result = await budgetShockService.getCurrentBudgetShock()

    expect(result.hasCurrentCutoff).toBe(false)
    expect(result.risk).toBeNull()
    expect(result.forecast).toBeNull()
    expect(result.recommendation).toBeNull()
    expect(result.activeAlert).toBeNull()
  })

  it('orchestrates forecast, budgets, risk, recommendation, and alert sync for active cutoff', async () => {
    const mockCutoff = { id: 10, name: 'Current Cycle' }
    cutoffService.findCurrentCutoff.mockResolvedValue(mockCutoff)

    const mockForecast = {
      cutoffId: 10,
      asOfDate: '2026-06-20',
      remainingDays: 10,
      availableCash: 20000,
      dailyBurnRate: 500,
      safeDailySpend: 2000,
      projectedRemaining: 15000,
      projectedDeficit: 0,
    }

    cashflowService.calculateForecastForCutoff.mockResolvedValue({
      hasCurrentCutoff: true,
      forecast: mockForecast,
    })

    budgetRepository.findByCutoff.mockResolvedValue([
      { categoryId: 1, plannedAmount: 1000, spentAmountSnapshot: 500 },
    ])

    budgetShockAlertService.synchronizeAlert.mockResolvedValue(null)

    const result = await budgetShockService.getCurrentBudgetShock('2026-06-20')

    expect(result.hasCurrentCutoff).toBe(true)
    expect(result.forecast).toBe(mockForecast)
    expect(result.risk.level).toBe(RISK_LEVELS.green)
    expect(result.risk.score).toBe(0)
    expect(result.recommendation).toBeNull()
    expect(budgetShockAlertService.synchronizeAlert).toHaveBeenCalled()
  })

  it('synchronizes active alert when evaluated risk is Orange or Red', async () => {
    const mockForecast = {
      cutoffId: 10,
      asOfDate: '2026-06-20',
      remainingDays: 5,
      availableCash: 1000,
      dailyBurnRate: 1500, // Exceeds safeDailySpend (200) -> Orange
      safeDailySpend: 200,
      projectedRemaining: 0,
      projectedDeficit: 0,
    }

    cashflowService.calculateForecastForCutoff.mockResolvedValue({
      hasCurrentCutoff: true,
      forecast: mockForecast,
    })

    budgetRepository.findByCutoff.mockResolvedValue([])

    const mockAlert = { id: 5, cutoffId: 10, level: 'orange', status: 'active' }
    budgetShockAlertService.synchronizeAlert.mockResolvedValue(mockAlert)

    const result = await budgetShockService.evaluateBudgetShockForCutoff(10, '2026-06-20')

    expect(result.risk.level).toBe(RISK_LEVELS.orange)
    expect(result.risk.score).toBe(2)
    expect(result.recommendation).not.toBeNull()
    expect(result.recommendation.severity).toBe('warning')
    expect(result.activeAlert).toBe(mockAlert)
  })
})
