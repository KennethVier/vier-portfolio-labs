import { beforeEach, describe, expect, it, vi } from 'vitest'

import { cashflowService } from '@/features/cashflow/services/cashflowService.js'
import { cutoffService } from '@/features/salary-cutoff/services/cutoffService.js'

import { CUTOFF_TREND } from '../../models/cutoffInsight.js'
import { CUTOFF_RULE_STATUS } from '../../models/cutoffRuleResult.js'
import { INSIGHT_SCOPES } from '../../utils/insightConstants.js'
import { generateCutoffInsight } from './cutoffEngine.js'

vi.mock('@/features/cashflow/services/cashflowService.js', () => ({
  cashflowService: {
    calculateCashflowForCutoff: vi.fn(),
  },
}))

vi.mock('@/features/salary-cutoff/services/cutoffService.js', () => ({
  cutoffService: {
    loadCutoffs: vi.fn(),
  },
}))

const cutoffs = [
  { id: 1, name: 'Sep 1-15', startDate: '2026-09-01', endDate: '2026-09-15' },
  { id: 2, name: 'Sep 16-30', startDate: '2026-09-16', endDate: '2026-09-30' },
  { id: 3, name: 'Oct 1-15', startDate: '2026-10-01', endDate: '2026-10-15' },
]

function cashflow(id, income, expenses, savings) {
  return {
    cashflow: {
      cutoffId: id,
      cutoffName: cutoffs.find((cutoff) => cutoff.id === id).name,
      actualIncome: income,
      totalExpenses: expenses,
      totalSavings: savings,
      remainingCash: income - expenses - savings,
    },
  }
}

function mockData(byId, list = cutoffs) {
  cutoffService.loadCutoffs.mockResolvedValue({
    cutoffs: list,
    currentCutoff: list.find((cutoff) => cutoff.id === 3) ?? null,
  })
  cashflowService.calculateCashflowForCutoff.mockImplementation(async (id) =>
    byId[id] ?? { cashflow: null },
  )
}

describe('cutoff engine', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('compares current vs previous cutoff and average for income, expenses, savings', async () => {
    mockData({
      1: cashflow(1, 20000, 15000, 1000),
      2: cashflow(2, 30000, 10000, 5000),
      3: cashflow(3, 36000, 8000, 6000),
    })

    const insight = await generateCutoffInsight({
      scope: INSIGHT_SCOPES.currentCutoff,
    })
    const { metrics } = insight

    expect(insight.category).toBe('cutoff')
    expect(metrics.previousCutoff.cutoffId).toBe(2)
    expect(metrics.previousCutoffComparison.income).toMatchObject({
      difference: 6000,
      percentageChange: 20,
      direction: CUTOFF_TREND.increasing,
    })
    expect(metrics.previousCutoffComparison.expenses).toMatchObject({
      difference: -2000,
      percentageChange: -20,
      direction: CUTOFF_TREND.decreasing,
    })
    expect(metrics.previousCutoffComparison.savings).toMatchObject({
      difference: 1000,
      direction: CUTOFF_TREND.increasing,
    })
    expect(metrics.averageComparison.cutoffCount).toBe(2)
    expect(metrics.averageComparison.monthCount).toBe(1)
    expect(metrics.averageComparison.income).toMatchObject({
      comparisonTotal: 50000,
      difference: -14000,
    })
    expect(insight.diagnostics.executedRules).toHaveLength(7)
    expect(insight.explanation).toContain('Versus Sep 16-30')
  })

  it('selects best and worst cutoff by remaining cash and reports trend direction', async () => {
    mockData({
      1: cashflow(1, 20000, 15000, 1000),
      2: cashflow(2, 30000, 10000, 5000),
      3: cashflow(3, 25000, 20000, 4000),
    })

    const { metrics, breakdown } = await generateCutoffInsight({
      scope: INSIGHT_SCOPES.currentCutoff,
    })

    expect(metrics.bestCutoff.cutoffId).toBe(2)
    expect(metrics.worstCutoff.cutoffId).toBe(3)
    expect(metrics.trend).toMatchObject({
      direction: CUTOFF_TREND.decreasing,
      cutoffsCompared: 3,
    })
    expect(
      breakdown.find((rule) => rule.id === 'best_worst_cutoff').status,
    ).toBe(CUTOFF_RULE_STATUS.warning)
  })

  it('returns No Data comparisons when no previous cutoff exists', async () => {
    const only = [cutoffs[2]]

    mockData({ 3: cashflow(3, 30000, 10000, 5000) }, only)

    const { metrics, breakdown, diagnostics } = await generateCutoffInsight({
      scope: INSIGHT_SCOPES.currentCutoff,
    })

    expect(metrics.currentCutoff.cutoffId).toBe(3)
    expect(metrics.previousCutoff).toBeNull()
    expect(metrics.previousCutoffComparison.income.direction).toBe(
      CUTOFF_TREND.noData,
    )
    expect(metrics.averageComparison.cutoffCount).toBe(0)
    expect(metrics.bestCutoff).toBeNull()
    expect(metrics.trend.direction).toBe(CUTOFF_TREND.noData)
    expect(
      breakdown.every((rule) => rule.status === CUTOFF_RULE_STATUS.noData),
    ).toBe(true)
    expect(diagnostics.warnings).toContain('No previous cutoff')
  })

  it('treats a previous cutoff without recorded activity as No Data', async () => {
    mockData({
      2: cashflow(2, 0, 0, 0),
      3: cashflow(3, 30000, 10000, 5000),
    })

    const { metrics, diagnostics } = await generateCutoffInsight({
      scope: INSIGHT_SCOPES.currentCutoff,
    })

    expect(metrics.previousCutoff).toBeNull()
    expect(metrics.trend.direction).toBe(CUTOFF_TREND.noData)
    expect(diagnostics.warnings).toContain('No previous cutoff data')
  })

  it('returns no-data insight when there is no current cutoff', async () => {
    cutoffService.loadCutoffs.mockResolvedValue({ cutoffs: [], currentCutoff: null })

    const insight = await generateCutoffInsight({
      scope: INSIGHT_SCOPES.currentCutoff,
    })

    expect(cashflowService.calculateCashflowForCutoff).not.toHaveBeenCalled()
    expect(insight.metrics.currentCutoff).toBeNull()
    expect(insight.diagnostics.warnings).toContain('No current cutoff')
  })
})
