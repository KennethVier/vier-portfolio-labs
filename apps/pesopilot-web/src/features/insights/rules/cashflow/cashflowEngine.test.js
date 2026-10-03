import { beforeEach, describe, expect, it, vi } from 'vitest'

import { cashflowService } from '@/features/cashflow/services/cashflowService.js'
import { cutoffService } from '@/features/salary-cutoff/services/cutoffService.js'

import {
  CASHFLOW_POSITION,
  CASHFLOW_STABILITY,
  COVERAGE_STATUS,
  SPENDING_PACE_STATUS,
} from '../../models/cashflowInsight.js'
import { CASHFLOW_RULE_STATUS } from '../../models/cashflowRuleResult.js'
import { INSIGHT_SCOPES } from '../../utils/insightConstants.js'
import { generateCashflowInsight } from './cashflowEngine.js'

vi.mock('@/features/cashflow/services/cashflowService.js', () => ({
  cashflowService: {
    calculateCashflowForCutoff: vi.fn(),
  },
}))

vi.mock('@/features/salary-cutoff/services/cutoffService.js', () => ({
  cutoffService: {
    findCurrentCutoff: vi.fn(),
  },
}))

describe('cashflow engine', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('builds deterministic current-cutoff cashflow metrics and spending pace', async () => {
    cutoffService.findCurrentCutoff.mockResolvedValue({
      id: 1,
      name: 'Oct 1-15',
      startDate: '2026-10-01',
      endDate: '2026-10-15',
    })
    cashflowService.calculateCashflowForCutoff.mockResolvedValue({
      hasCurrentCutoff: true,
      cashflow: {
        cutoffId: 1,
        cutoffName: 'Oct 1-15',
        expectedIncome: 30000,
        actualIncome: 30000,
        totalExpenses: 10000,
        totalSavings: 5000,
        remainingCash: 15000,
        expenseRate: 33.33,
        savingsRate: 16.67,
        incomeVariance: 0,
      },
    })

    const insight = await generateCashflowInsight({
      scope: INSIGHT_SCOPES.currentCutoff,
      today: new Date('2026-10-05T12:00:00.000Z'),
    })

    expect(cashflowService.calculateCashflowForCutoff).toHaveBeenCalledWith(1)
    expect(insight.category).toBe('cashflow')
    expect(insight.metrics.remainingCash).toBe(15000)
    expect(insight.metrics.netCashflow).toBe(20000)
    expect(insight.metrics.position).toBe(CASHFLOW_POSITION.positive)
    expect(insight.metrics.spendingPace).toMatchObject({
      status: SPENDING_PACE_STATUS.onPace,
      dailySpendingRate: 2000,
      elapsedDays: 5,
      totalDays: 15,
      elapsedPercent: 33.33,
      spendingPercent: 33.33,
      paceDelta: 0,
    })
    expect(insight.metrics.incomeCoverage).toMatchObject({
      status: COVERAGE_STATUS.covered,
      coveragePercent: 200,
    })
    expect(insight.metrics.savingsCoverage).toMatchObject({
      status: COVERAGE_STATUS.covered,
      coveragePercent: 400,
    })
    expect(insight.metrics.stability.status).toBe(CASHFLOW_STABILITY.stable)
    expect(insight.diagnostics.executedRules).toEqual([
      'remaining_cash',
      'net_cashflow',
      'spending_pace',
      'income_coverage',
      'savings_coverage',
      'cashflow_stability',
    ])
    expect(insight.evidence.length).toBeGreaterThan(0)
  })

  it('returns no-data cashflow insight when no current cutoff exists', async () => {
    cutoffService.findCurrentCutoff.mockResolvedValue(null)

    const insight = await generateCashflowInsight({
      scope: INSIGHT_SCOPES.currentCutoff,
      today: new Date('2026-10-05T12:00:00.000Z'),
    })

    expect(cashflowService.calculateCashflowForCutoff).not.toHaveBeenCalled()
    expect(insight.metrics.position).toBe(CASHFLOW_POSITION.noData)
    expect(insight.metrics.spendingPace.status).toBe(SPENDING_PACE_STATUS.noData)
    expect(insight.metrics.stability.status).toBe(CASHFLOW_STABILITY.noData)
    expect(insight.breakdown).toHaveLength(6)
    expect(
      insight.breakdown.every((rule) => rule.status === CASHFLOW_RULE_STATUS.noData),
    ).toBe(true)
    expect(insight.diagnostics.warnings).toContain('No current cutoff')
  })
})
