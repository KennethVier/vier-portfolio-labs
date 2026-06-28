import { describe, expect, it, vi } from 'vitest'

import { INSIGHT_SCOPES } from '../utils/insightConstants.js'

import { insightService } from './insightService.js'

vi.mock('../rules/health/healthEngine.js', () => ({
  generateHealthInsight: vi.fn(async ({ scope }) => ({
    category: 'health',
    scope,
    generatedAt: '2026-06-28T00:00:00.000Z',
    score: 80,
    status: 'Healthy',
    breakdown: [],
    strengths: [],
    weaknesses: [],
    evidence: [],
    explanation: 'Financial health is Healthy with a score of 80.',
    diagnostics: {
      executedRules: [],
      warnings: [],
    },
  })),
}))

vi.mock('../rules/expense/expenseEngine.js', () => ({
  generateExpenseInsight: vi.fn(async ({ scope }) => ({
    category: 'expense',
    scope,
    generatedAt: '2026-06-28T00:01:00.000Z',
    metrics: {
      totalExpenses: 1000,
      expenseCount: 2,
      dailySpendingRate: 100,
      currentPeriodDays: 10,
      categoryDistribution: [],
      topSpendingCategory: null,
      largestExpense: null,
      largestMerchant: null,
      trend: {
        direction: 'No Data',
        currentTotal: 1000,
        comparisonTotal: 0,
        difference: 0,
        percentageChange: 0,
      },
      increase: null,
      decrease: null,
      anomalies: [],
    },
    breakdown: [],
    evidence: [],
    explanation: 'No expenses are recorded for this scope yet.',
    diagnostics: {
      executedRules: [],
      warnings: [],
    },
  })),
}))

describe('insightService', () => {
  it('loads an InsightBundle with health and expenses populated by default', async () => {
    await expect(insightService.loadInsights()).resolves.toEqual({
      scope: INSIGHT_SCOPES.currentCutoff,
      generatedAt: expect.any(String),
      health: {
        category: 'health',
        scope: INSIGHT_SCOPES.currentCutoff,
        generatedAt: '2026-06-28T00:00:00.000Z',
        score: 80,
        status: 'Healthy',
        breakdown: [],
        strengths: [],
        weaknesses: [],
        evidence: [],
        explanation: 'Financial health is Healthy with a score of 80.',
        diagnostics: {
          executedRules: [],
          warnings: [],
        },
      },
      expenses: {
        category: 'expense',
        scope: INSIGHT_SCOPES.currentCutoff,
        generatedAt: '2026-06-28T00:01:00.000Z',
        metrics: {
          totalExpenses: 1000,
          expenseCount: 2,
          dailySpendingRate: 100,
          currentPeriodDays: 10,
          categoryDistribution: [],
          topSpendingCategory: null,
          largestExpense: null,
          largestMerchant: null,
          trend: {
            direction: 'No Data',
            currentTotal: 1000,
            comparisonTotal: 0,
            difference: 0,
            percentageChange: 0,
          },
          increase: null,
          decrease: null,
          anomalies: [],
        },
        breakdown: [],
        evidence: [],
        explanation: 'No expenses are recorded for this scope yet.',
        diagnostics: {
          executedRules: [],
          warnings: [],
        },
      },
      income: null,
      savings: null,
      goals: null,
      cashflow: null,
      cutoff: null,
      recommendations: [],
      summary: null,
    })
  })

  it('loads health and expenses for a supplied scope without filling other sections', async () => {
    const bundle = await insightService.loadInsights({
      scope: INSIGHT_SCOPES.specificCutoff,
    })

    expect(bundle.scope).toBe(INSIGHT_SCOPES.specificCutoff)
    expect(bundle.health.scope).toBe(INSIGHT_SCOPES.specificCutoff)
    expect(bundle.expenses.scope).toBe(INSIGHT_SCOPES.specificCutoff)
    expect(bundle.income).toBeNull()
    expect(bundle.savings).toBeNull()
    expect(bundle.goals).toBeNull()
    expect(bundle.cashflow).toBeNull()
    expect(bundle.cutoff).toBeNull()
    expect(bundle.summary).toBeNull()
    expect(bundle.recommendations).toEqual([])
  })
})
