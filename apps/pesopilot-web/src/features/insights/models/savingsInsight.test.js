import { describe, expect, it } from 'vitest'

import {
  SAVINGS_CONSISTENCY,
  SAVINGS_RATE_STATUS,
  SAVINGS_TREND,
  createEmptySavingsMetrics,
  createSavingsInsight,
} from './savingsInsight.js'

describe('SavingsInsight model', () => {
  it('creates the default savings metrics shape', () => {
    expect(createEmptySavingsMetrics()).toEqual({
      totalSavings: 0,
      savingsCount: 0,
      averageContribution: 0,
      savingsRate: {
        rate: 0,
        totalIncome: 0,
        totalSavings: 0,
        status: SAVINGS_RATE_STATUS.noData,
      },
      trend: {
        currentTotal: 0,
        comparisonTotal: 0,
        difference: 0,
        percentageChange: 0,
        direction: SAVINGS_TREND.noData,
      },
      previousCutoffComparison: {
        currentTotal: 0,
        comparisonTotal: 0,
        difference: 0,
        percentageChange: 0,
        direction: SAVINGS_TREND.noData,
      },
      contributionFrequency: {
        contributionCount: 0,
        currentPeriodDays: 0,
        activeContributionDays: 0,
        contributionsPerWeek: 0,
      },
      largestSavingsContribution: null,
      consistency: {
        status: SAVINGS_CONSISTENCY.noData,
        contributionCount: 0,
        contributionDays: 0,
        variancePercent: null,
      },
    })
  })

  it('creates a serializable SavingsInsight with supplied scope', () => {
    const insight = createSavingsInsight({
      scope: 'specific_cutoff',
    })

    expect(insight).toMatchObject({
      category: 'savings',
      scope: 'specific_cutoff',
      breakdown: [],
      evidence: [],
      explanation: '',
      diagnostics: {
        executedRules: [],
        warnings: [],
      },
    })
    expect(new Date(insight.generatedAt).toISOString()).toBe(insight.generatedAt)
  })
})
