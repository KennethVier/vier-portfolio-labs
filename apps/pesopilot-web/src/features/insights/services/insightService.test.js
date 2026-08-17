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

vi.mock('../rules/income/incomeEngine.js', () => ({
  generateIncomeInsight: vi.fn(async ({ scope }) => ({
    category: 'income',
    scope,
    generatedAt: '2026-06-28T00:02:00.000Z',
    metrics: {
      totalIncome: 40000,
      incomeCount: 1,
      averageIncome: 40000,
      sourceBreakdown: [],
      primarySource: null,
      previousCutoffComparison: {
        direction: 'No Data',
        currentTotal: 40000,
        comparisonTotal: 0,
        difference: 0,
        percentageChange: 0,
      },
      monthlyComparison: {
        currentMonth: null,
        previousMonth: null,
        currentTotal: 0,
        previousTotal: 0,
        difference: 0,
        percentageChange: 0,
        direction: 'No Data',
      },
      trend: {
        direction: 'No Data',
        currentTotal: 40000,
        comparisonTotal: 0,
        difference: 0,
        percentageChange: 0,
      },
      missingIncome: {
        missing: false,
        expectedIncome: 0,
        actualIncome: 40000,
        gap: 0,
        reason: '',
      },
      stability: {
        status: 'No Data',
        recordCount: 1,
        sourceCount: 0,
        primarySourceShare: 0,
        variancePercent: null,
      },
    },
    breakdown: [],
    evidence: [],
    explanation: 'No income is recorded for this scope yet.',
    diagnostics: {
      executedRules: [],
      warnings: [],
    },
  })),
}))

vi.mock('../rules/savings/savingsEngine.js', () => ({
  generateSavingsInsight: vi.fn(async ({ scope }) => ({
    category: 'savings',
    scope,
    generatedAt: '2026-06-28T00:03:00.000Z',
    metrics: {
      totalSavings: 8000,
      savingsCount: 2,
      averageContribution: 4000,
      savingsRate: {
        rate: 20,
        totalIncome: 40000,
        totalSavings: 8000,
        status: 'Strong',
      },
      trend: {
        direction: 'No Data',
        currentTotal: 8000,
        comparisonTotal: 0,
        difference: 0,
        percentageChange: 0,
      },
      previousCutoffComparison: {
        direction: 'No Data',
        currentTotal: 8000,
        comparisonTotal: 0,
        difference: 0,
        percentageChange: 0,
      },
      contributionFrequency: {
        contributionCount: 2,
        currentPeriodDays: 30,
        activeContributionDays: 2,
        contributionsPerWeek: 0.47,
      },
      largestSavingsContribution: null,
      consistency: {
        status: 'No Data',
        contributionCount: 2,
        contributionDays: 2,
        variancePercent: null,
      },
    },
    breakdown: [],
    evidence: [],
    explanation: 'No savings are recorded for this scope yet.',
    diagnostics: {
      executedRules: [],
      warnings: [],
    },
  })),
}))

describe('insightService', () => {
  it('loads an InsightBundle with health, expenses, income, and savings populated by default', async () => {
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
      income: {
        category: 'income',
        scope: INSIGHT_SCOPES.currentCutoff,
        generatedAt: '2026-06-28T00:02:00.000Z',
        metrics: {
          totalIncome: 40000,
          incomeCount: 1,
          averageIncome: 40000,
          sourceBreakdown: [],
          primarySource: null,
          previousCutoffComparison: {
            direction: 'No Data',
            currentTotal: 40000,
            comparisonTotal: 0,
            difference: 0,
            percentageChange: 0,
          },
          monthlyComparison: {
            currentMonth: null,
            previousMonth: null,
            currentTotal: 0,
            previousTotal: 0,
            difference: 0,
            percentageChange: 0,
            direction: 'No Data',
          },
          trend: {
            direction: 'No Data',
            currentTotal: 40000,
            comparisonTotal: 0,
            difference: 0,
            percentageChange: 0,
          },
          missingIncome: {
            missing: false,
            expectedIncome: 0,
            actualIncome: 40000,
            gap: 0,
            reason: '',
          },
          stability: {
            status: 'No Data',
            recordCount: 1,
            sourceCount: 0,
            primarySourceShare: 0,
            variancePercent: null,
          },
        },
        breakdown: [],
        evidence: [],
        explanation: 'No income is recorded for this scope yet.',
        diagnostics: {
          executedRules: [],
          warnings: [],
        },
      },
      savings: {
        category: 'savings',
        scope: INSIGHT_SCOPES.currentCutoff,
        generatedAt: '2026-06-28T00:03:00.000Z',
        metrics: {
          totalSavings: 8000,
          savingsCount: 2,
          averageContribution: 4000,
          savingsRate: {
            rate: 20,
            totalIncome: 40000,
            totalSavings: 8000,
            status: 'Strong',
          },
          trend: {
            direction: 'No Data',
            currentTotal: 8000,
            comparisonTotal: 0,
            difference: 0,
            percentageChange: 0,
          },
          previousCutoffComparison: {
            direction: 'No Data',
            currentTotal: 8000,
            comparisonTotal: 0,
            difference: 0,
            percentageChange: 0,
          },
          contributionFrequency: {
            contributionCount: 2,
            currentPeriodDays: 30,
            activeContributionDays: 2,
            contributionsPerWeek: 0.47,
          },
          largestSavingsContribution: null,
          consistency: {
            status: 'No Data',
            contributionCount: 2,
            contributionDays: 2,
            variancePercent: null,
          },
        },
        breakdown: [],
        evidence: [],
        explanation: 'No savings are recorded for this scope yet.',
        diagnostics: {
          executedRules: [],
          warnings: [],
        },
      },
      goals: null,
      cashflow: null,
      cutoff: null,
      recommendations: [],
      summary: null,
    })
  })

  it('loads health, expenses, income, and savings for a supplied scope without filling other sections', async () => {
    const bundle = await insightService.loadInsights({
      scope: INSIGHT_SCOPES.specificCutoff,
    })

    expect(bundle.scope).toBe(INSIGHT_SCOPES.specificCutoff)
    expect(bundle.health.scope).toBe(INSIGHT_SCOPES.specificCutoff)
    expect(bundle.expenses.scope).toBe(INSIGHT_SCOPES.specificCutoff)
    expect(bundle.income.scope).toBe(INSIGHT_SCOPES.specificCutoff)
    expect(bundle.savings.scope).toBe(INSIGHT_SCOPES.specificCutoff)
    expect(bundle.goals).toBeNull()
    expect(bundle.cashflow).toBeNull()
    expect(bundle.cutoff).toBeNull()
    expect(bundle.summary).toBeNull()
    expect(bundle.recommendations).toEqual([])
  })
})
