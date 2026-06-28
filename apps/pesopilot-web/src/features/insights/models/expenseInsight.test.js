import { describe, expect, it } from 'vitest'

import { INSIGHT_SCOPES } from '../utils/insightConstants.js'

import {
  createEmptyExpenseMetrics,
  createExpenseInsight,
  EXPENSE_TREND,
} from './expenseInsight.js'
import { createExpenseRuleResult, EXPENSE_RULE_STATUS } from './expenseRuleResult.js'

function expectIsoString(value) {
  expect(typeof value).toBe('string')
  expect(Number.isNaN(Date.parse(value))).toBe(false)
  expect(new Date(value).toISOString()).toBe(value)
}

describe('expense insight models', () => {
  it('creates the default ExpenseInsight shape', () => {
    const insight = createExpenseInsight({
      scope: INSIGHT_SCOPES.currentCutoff,
    })

    expect(insight).toEqual({
      category: 'expense',
      scope: INSIGHT_SCOPES.currentCutoff,
      generatedAt: expect.any(String),
      metrics: createEmptyExpenseMetrics(),
      breakdown: [],
      evidence: [],
      explanation: '',
      diagnostics: {
        executedRules: [],
        warnings: [],
      },
    })
    expectIsoString(insight.generatedAt)
  })

  it('defines expense trend values and empty metrics', () => {
    expect(EXPENSE_TREND).toEqual({
      decreasing: 'Decreasing',
      increasing: 'Increasing',
      noData: 'No Data',
      stable: 'Stable',
    })
    expect(createEmptyExpenseMetrics()).toEqual({
      totalExpenses: 0,
      expenseCount: 0,
      dailySpendingRate: 0,
      currentPeriodDays: 0,
      categoryDistribution: [],
      topSpendingCategory: null,
      largestExpense: null,
      largestMerchant: null,
      trend: {
        direction: EXPENSE_TREND.noData,
        currentTotal: 0,
        comparisonTotal: 0,
        difference: 0,
        percentageChange: 0,
      },
      increase: null,
      decrease: null,
      anomalies: [],
    })
  })

  it('creates serializable expense rule results with evidence arrays', () => {
    expect(
      createExpenseRuleResult({
        evidence: [
          {
            label: 'Total Expenses',
            value: 1200,
          },
        ],
        id: 'total_expenses',
        ruleName: 'Total Expenses',
        score: 100,
        severity: 'info',
        status: EXPENSE_RULE_STATUS.pass,
        weight: 10,
      }),
    ).toEqual({
      id: 'total_expenses',
      ruleName: 'Total Expenses',
      category: 'expense',
      domain: 'expenses',
      value: null,
      score: 100,
      status: EXPENSE_RULE_STATUS.pass,
      severity: 'info',
      weight: 10,
      passed: false,
      evidence: [
        {
          label: 'Total Expenses',
          value: 1200,
        },
      ],
      message: '',
    })
  })
})
