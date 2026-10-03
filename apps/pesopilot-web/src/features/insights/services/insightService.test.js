import { describe, expect, it, vi } from 'vitest'

import { INSIGHT_SCOPES } from '../utils/insightConstants.js'
import { generateCutoffInsight } from '../rules/cutoff/cutoffEngine.js'
import { generateExpenseInsight } from '../rules/expense/expenseEngine.js'
import { generateGoalInsight } from '../rules/goal/goalEngine.js'
import { generateIncomeInsight } from '../rules/income/incomeEngine.js'
import { generateSavingsInsight } from '../rules/savings/savingsEngine.js'

import { insightService } from './insightService.js'
import { summaryHistoryService } from './summaryHistoryService.js'

vi.mock('./summaryHistoryService.js', () => ({
  summaryHistoryService: {
    captureSummary: vi.fn(),
  },
}))

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

vi.mock('../rules/goal/goalEngine.js', () => ({
  generateGoalInsight: vi.fn(async ({ scope }) => ({
    category: 'goal',
    scope,
    generatedAt: '2026-06-28T00:04:00.000Z',
    metrics: {
      totalGoals: 1,
      activeGoals: 1,
      completedGoals: 0,
      totalTargetAmount: 10000,
      totalSavedAmount: 5000,
      overallCompletionRate: 50,
      highestFundedGoal: null,
      goalsWithoutContributions: [],
      goals: [],
    },
    breakdown: [],
    evidence: [],
    explanation: 'Overall goal completion is 50%.',
    diagnostics: {
      executedRules: [],
      warnings: [],
    },
  })),
}))

vi.mock('../rules/cashflow/cashflowEngine.js', () => ({
  generateCashflowInsight: vi.fn(async ({ scope }) => ({
    category: 'cashflow',
    scope,
  })),
}))

vi.mock('../rules/cutoff/cutoffEngine.js', () => ({
  generateCutoffInsight: vi.fn(async ({ scope }) => ({
    category: 'cutoff',
    scope,
  })),
}))

describe('insightService', () => {
  it('loads an InsightBundle with health, expenses, income, savings, and goals populated by default', async () => {
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
      goals: {
        category: 'goal',
        scope: INSIGHT_SCOPES.currentCutoff,
        generatedAt: '2026-06-28T00:04:00.000Z',
        metrics: {
          totalGoals: 1,
          activeGoals: 1,
          completedGoals: 0,
          totalTargetAmount: 10000,
          totalSavedAmount: 5000,
          overallCompletionRate: 50,
          highestFundedGoal: null,
          goalsWithoutContributions: [],
          goals: [],
        },
        breakdown: [],
        evidence: [],
        explanation: 'Overall goal completion is 50%.',
        diagnostics: {
          executedRules: [],
          warnings: [],
        },
      },
      cashflow: {
        category: 'cashflow',
        scope: INSIGHT_SCOPES.currentCutoff,
      },
      cutoff: {
        category: 'cutoff',
        scope: INSIGHT_SCOPES.currentCutoff,
      },
      recommendations: [],
      summary: expect.objectContaining({
        version: '1.0.0',
        scope: INSIGHT_SCOPES.currentCutoff,
      }),
    })
  })

  it('loads health, expenses, income, savings, and goals for a supplied scope without filling other sections', async () => {
    const bundle = await insightService.loadInsights({
      scope: INSIGHT_SCOPES.specificCutoff,
    })

    expect(bundle.scope).toBe(INSIGHT_SCOPES.specificCutoff)
    expect(bundle.health.scope).toBe(INSIGHT_SCOPES.specificCutoff)
    expect(bundle.expenses.scope).toBe(INSIGHT_SCOPES.specificCutoff)
    expect(bundle.income.scope).toBe(INSIGHT_SCOPES.specificCutoff)
    expect(bundle.savings.scope).toBe(INSIGHT_SCOPES.specificCutoff)
    expect(bundle.goals.scope).toBe(INSIGHT_SCOPES.specificCutoff)
    expect(bundle.cashflow.scope).toBe(INSIGHT_SCOPES.specificCutoff)
    expect(bundle.cutoff.scope).toBe(INSIGHT_SCOPES.specificCutoff)
    expect(bundle.summary).toEqual(
      expect.objectContaining({
        version: '1.0.0',
        scope: INSIGHT_SCOPES.specificCutoff,
      }),
    )
    expect(bundle.recommendations).toEqual([])
  })

  it('generates a financial summary reusing the exact generated recommendation bundle', async () => {
    const bundle = await insightService.loadInsights()
    expect(bundle.summary).toBeDefined()
    expect(bundle.summary.version).toBe('1.0.0')
    expect(bundle.summary.diagnostics.state).toBe('ready')
    expect(bundle.summary.sections.length).toBeGreaterThanOrEqual(3)
  })

  it('captures summary when summary is ready and current cutoff exists', async () => {
    summaryHistoryService.captureSummary.mockClear()
    generateCutoffInsight.mockResolvedValueOnce({
      category: 'cutoff',
      scope: INSIGHT_SCOPES.currentCutoff,
      metrics: {
        currentCutoff: {
          id: 10,
          startDate: '2026-06-01',
          endDate: '2026-06-15',
        },
      },
    })

    const bundle = await insightService.loadInsights()

    expect(summaryHistoryService.captureSummary).toHaveBeenCalledTimes(1)
    expect(summaryHistoryService.captureSummary).toHaveBeenCalledWith({
      summary: bundle.summary,
      cutoff: {
        id: 10,
        startDate: '2026-06-01',
        endDate: '2026-06-15',
      },
    })
  })

  it('does not capture summary when summary state is empty', async () => {
    summaryHistoryService.captureSummary.mockClear()
    generateCutoffInsight.mockResolvedValueOnce({
      category: 'cutoff',
      scope: INSIGHT_SCOPES.currentCutoff,
      metrics: {
        currentCutoff: { id: 10, startDate: '2026-06-01' },
      },
    })
    generateExpenseInsight.mockResolvedValueOnce({ category: 'expense', metrics: null })
    generateIncomeInsight.mockResolvedValueOnce({ category: 'income', metrics: null })
    generateSavingsInsight.mockResolvedValueOnce({ category: 'savings', metrics: null })
    generateGoalInsight.mockResolvedValueOnce({ category: 'goal', metrics: null })

    const bundle = await insightService.loadInsights()

    expect(bundle.summary.diagnostics.state).toBe('empty')
    expect(summaryHistoryService.captureSummary).not.toHaveBeenCalled()
  })

  it('does not capture summary when no current cutoff exists', async () => {
    summaryHistoryService.captureSummary.mockClear()
    generateCutoffInsight.mockResolvedValueOnce({
      category: 'cutoff',
      scope: INSIGHT_SCOPES.currentCutoff,
      metrics: {
        currentCutoff: null,
      },
    })

    const bundle = await insightService.loadInsights()

    expect(bundle.summary.diagnostics.state).toBe('ready')
    expect(summaryHistoryService.captureSummary).not.toHaveBeenCalled()
  })

  it('propagates failure when captureSummary rejects', async () => {
    summaryHistoryService.captureSummary.mockClear()
    summaryHistoryService.captureSummary.mockRejectedValueOnce(
      new Error('IndexedDB storage failure'),
    )
    generateCutoffInsight.mockResolvedValueOnce({
      category: 'cutoff',
      scope: INSIGHT_SCOPES.currentCutoff,
      metrics: {
        currentCutoff: { id: 10, startDate: '2026-06-01' },
      },
    })

    await expect(insightService.loadInsights()).rejects.toThrow(
      'IndexedDB storage failure',
    )
  })
})
