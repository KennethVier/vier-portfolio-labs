import { describe, expect, it, vi } from 'vitest'

import { INSIGHT_SCOPES } from '../../utils/insightConstants.js'
import { generateIncomeInsight } from './incomeEngine.js'

vi.mock('@/features/income/services/incomeService.js', () => ({
  incomeService: {
    loadIncome: vi.fn(async () => [
      {
        amount: 40000,
        cutoffId: 1,
        date: '2026-06-25',
        id: 1,
        source: 'Salary',
      },
      {
        amount: 10000,
        cutoffId: 1,
        date: '2026-06-26',
        id: 2,
        source: 'Bonus',
      },
      {
        amount: 45000,
        cutoffId: 2,
        date: '2026-05-25',
        id: 3,
        source: 'Salary',
      },
      {
        amount: 5000,
        cutoffId: 3,
        date: '2026-05-10',
        id: 4,
        source: 'Freelance',
      },
    ]),
    loadSalaryCutoffs: vi.fn(async () => [
      {
        endDate: '2026-07-24',
        expectedIncome: 40000,
        id: 1,
        name: 'Current',
        startDate: '2026-06-25',
      },
      {
        endDate: '2026-06-24',
        expectedIncome: 40000,
        id: 2,
        name: 'Previous',
        startDate: '2026-05-25',
      },
      {
        endDate: '2026-05-24',
        expectedIncome: 0,
        id: 3,
        name: 'Older',
        startDate: '2026-04-25',
      },
    ]),
  },
}))

vi.mock('@/features/salary-cutoff/services/cutoffService.js', () => ({
  cutoffService: {
    findCurrentCutoff: vi.fn(async () => ({
      endDate: '2026-07-24',
      expectedIncome: 40000,
      id: 1,
      name: 'Current',
      startDate: '2026-06-25',
    })),
  },
}))

describe('income engine', () => {
  it('generates an IncomeInsight from normalized current-cutoff income', async () => {
    const insight = await generateIncomeInsight({
      scope: INSIGHT_SCOPES.currentCutoff,
    })

    expect(insight.category).toBe('income')
    expect(insight.scope).toBe(INSIGHT_SCOPES.currentCutoff)
    expect(insight.metrics.totalIncome).toBe(50000)
    expect(insight.metrics.incomeCount).toBe(2)
    expect(insight.metrics.primarySource).toMatchObject({
      amount: 40000,
      source: 'Salary',
    })
    expect(insight.metrics.previousCutoffComparison).toMatchObject({
      currentTotal: 50000,
      comparisonTotal: 45000,
      direction: 'Increasing',
      percentageChange: 11.11,
    })
    expect(insight.metrics.monthlyComparison).toMatchObject({
      currentMonth: '2026-06',
      previousMonth: '2026-05',
      currentTotal: 50000,
      previousTotal: 50000,
      direction: 'Stable',
    })
    expect(insight.diagnostics.executedRules).toEqual([
      'total_income',
      'income_source_breakdown',
      'previous_cutoff_comparison',
      'monthly_comparison',
      'income_trend',
      'missing_income_detection',
      'income_stability',
    ])
  })
})
