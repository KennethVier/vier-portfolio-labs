import { describe, expect, it } from 'vitest'

import {
  INCOME_STABILITY,
  INCOME_TREND,
  createEmptyIncomeMetrics,
  createIncomeInsight,
} from './incomeInsight.js'

describe('IncomeInsight model', () => {
  it('creates the default income metrics shape', () => {
    expect(createEmptyIncomeMetrics()).toEqual({
      totalIncome: 0,
      incomeCount: 0,
      averageIncome: 0,
      sourceBreakdown: [],
      primarySource: null,
      previousCutoffComparison: {
        currentTotal: 0,
        comparisonTotal: 0,
        difference: 0,
        percentageChange: 0,
        direction: INCOME_TREND.noData,
      },
      monthlyComparison: {
        currentMonth: null,
        previousMonth: null,
        currentTotal: 0,
        previousTotal: 0,
        difference: 0,
        percentageChange: 0,
        direction: INCOME_TREND.noData,
      },
      trend: {
        currentTotal: 0,
        comparisonTotal: 0,
        difference: 0,
        percentageChange: 0,
        direction: INCOME_TREND.noData,
      },
      missingIncome: {
        missing: false,
        expectedIncome: 0,
        actualIncome: 0,
        gap: 0,
        reason: '',
      },
      stability: {
        status: INCOME_STABILITY.noData,
        recordCount: 0,
        sourceCount: 0,
        primarySourceShare: 0,
        variancePercent: null,
      },
    })
  })

  it('creates a serializable IncomeInsight with supplied scope', () => {
    const insight = createIncomeInsight({
      scope: 'specific_cutoff',
    })

    expect(insight).toMatchObject({
      category: 'income',
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
