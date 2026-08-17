import { describe, expect, it, vi } from 'vitest'

import { INSIGHT_SCOPES } from '../../utils/insightConstants.js'
import { generateSavingsInsight } from './savingsEngine.js'

vi.mock('@/features/savings/services/savingsService.js', () => ({
  savingsService: {
    loadSavings: vi.fn(async () => [
      {
        amount: 5000,
        cutoffId: 1,
        date: '2026-06-05',
        goalId: 10,
        goalName: 'TERRA',
        id: 1,
        source: 'Emergency Fund',
      },
      {
        amount: 3000,
        cutoffId: 1,
        date: '2026-06-20',
        id: 2,
        source: 'General Savings',
      },
      {
        amount: 6000,
        cutoffId: 2,
        date: '2026-05-20',
        id: 3,
        source: 'Emergency Fund',
      },
    ]),
  },
}))

vi.mock('@/features/income/services/incomeService.js', () => ({
  incomeService: {
    loadIncome: vi.fn(async () => [
      {
        amount: 40000,
        cutoffId: 1,
        date: '2026-06-01',
        id: 1,
        source: 'Salary',
      },
    ]),
  },
}))

vi.mock('@/features/salary-cutoff/services/cutoffService.js', () => ({
  cutoffService: {
    loadCutoffs: vi.fn(async () => ({
      currentCutoff: {
        endDate: '2026-06-30',
        id: 1,
        name: 'Current',
        startDate: '2026-06-01',
      },
      cutoffs: [
        {
          endDate: '2026-06-30',
          id: 1,
          name: 'Current',
          startDate: '2026-06-01',
        },
        {
          endDate: '2026-05-31',
          id: 2,
          name: 'Previous',
          startDate: '2026-05-01',
        },
      ],
    })),
  },
}))

describe('savings engine', () => {
  it('generates a SavingsInsight from normalized current-cutoff savings', async () => {
    const insight = await generateSavingsInsight({
      scope: INSIGHT_SCOPES.currentCutoff,
    })

    expect(insight.category).toBe('savings')
    expect(insight.scope).toBe(INSIGHT_SCOPES.currentCutoff)
    expect(insight.metrics.totalSavings).toBe(8000)
    expect(insight.metrics.savingsCount).toBe(2)
    expect(insight.metrics.savingsRate).toMatchObject({
      rate: 20,
      totalIncome: 40000,
      totalSavings: 8000,
      status: 'Strong',
    })
    expect(insight.metrics.previousCutoffComparison).toMatchObject({
      currentTotal: 8000,
      comparisonTotal: 6000,
      direction: 'Increasing',
      percentageChange: 33.33,
    })
    expect(insight.metrics.largestSavingsContribution).toMatchObject({
      amount: 5000,
      goalId: 10,
      goalName: 'TERRA',
    })
    expect(insight.diagnostics.executedRules).toEqual([
      'savings_total',
      'savings_rate',
      'savings_trend',
      'previous_cutoff_comparison',
      'contribution_frequency',
      'largest_savings_contribution',
      'savings_consistency',
    ])
  })

  it('keeps calculated output deterministic apart from generatedAt', async () => {
    const firstInsight = await generateSavingsInsight({
      scope: INSIGHT_SCOPES.currentCutoff,
    })
    const secondInsight = await generateSavingsInsight({
      scope: INSIGHT_SCOPES.currentCutoff,
    })
    const stripTimestamp = (insight) => {
      const copy = { ...insight }
      delete copy.generatedAt
      return copy
    }

    expect(stripTimestamp(firstInsight)).toEqual(stripTimestamp(secondInsight))
  })
})
