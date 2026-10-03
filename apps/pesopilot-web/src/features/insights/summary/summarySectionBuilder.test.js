import { describe, expect, it } from 'vitest'
import {
  buildCandidateSections,
  formatCurrency,
  formatPercent,
  hasSufficientFinancialData,
} from './summarySectionBuilder.js'

describe('summarySectionBuilder', () => {
  it('formats currency and percentages deterministically for display', () => {
    expect(formatCurrency(5000)).toBe('₱5,000')
    expect(formatCurrency(27000.5)).toBe('₱27,000.5')
    expect(formatCurrency(null)).toBe('₱0')
    expect(formatPercent(22)).toBe('22%')
    expect(formatPercent(22.5)).toBe('22.5%')
    expect(formatPercent(null)).toBe('0%')
  })

  it('enforces empty data gate: health alone does not make data sufficient (Correction 6)', () => {
    const healthOnly = {
      cashflow: { metrics: { netCashflow: 0, position: 'No Data', remainingCash: 0 } },
      expenses: { metrics: { expenseCount: 0, totalExpenses: 0 } },
      goals: { metrics: { activeGoals: 0, totalGoals: 0 } },
      health: { score: 85, status: 'Healthy' },
      income: { metrics: { incomeCount: 0, totalIncome: 0 } },
      savings: { metrics: { savingsCount: 0, totalSavings: 0 } },
    }

    expect(hasSufficientFinancialData(healthOnly)).toBe(false)
    const result = buildCandidateSections({ insightBundle: healthOnly, recommendationBundle: { recommendations: [] } })
    expect(result.state).toBe('empty')
    expect(result.candidates).toEqual([])
  })

  it('identifies sufficient financial data when at least one domain has records', () => {
    const withCashflow = {
      cashflow: { metrics: { netCashflow: 1000, position: 'Positive', remainingCash: 5000 } },
    }
    expect(hasSufficientFinancialData(withCashflow)).toBe(true)

    const withIncome = {
      income: { metrics: { incomeCount: 1, totalIncome: 20000 } },
    }
    expect(hasSufficientFinancialData(withIncome)).toBe(true)

    const withExpenses = {
      expenses: { metrics: { expenseCount: 2, totalExpenses: 3000 } },
    }
    expect(hasSufficientFinancialData(withExpenses)).toBe(true)

    const withSavings = {
      savings: { metrics: { savingsCount: 1, totalSavings: 1000 } },
    }
    expect(hasSufficientFinancialData(withSavings)).toBe(true)

    const withGoals = {
      goals: { metrics: { activeGoals: 1, totalGoals: 1 } },
    }
    expect(hasSufficientFinancialData(withGoals)).toBe(true)
  })

  it('extracts current position candidates with raw evidence and formatted variables (Correction 3 & 4)', () => {
    const bundle = {
      cashflow: {
        metrics: {
          position: 'Positive',
          remainingCash: 4500,
          spendingPace: { status: 'On Pace' },
        },
      },
      expenses: {
        metrics: {
          expenseCount: 3,
          topSpendingCategory: {
            amount: 2000,
            categoryId: 'cat_food',
            categoryName: 'Food',
            count: 2,
            percentage: 40,
          },
          totalExpenses: 5000,
        },
      },
      goals: {
        metrics: {
          activeGoals: 2,
          overallCompletionRate: 50,
          totalGoals: 2,
        },
      },
      health: {
        score: 80,
        status: 'Healthy',
      },
      income: {
        metrics: {
          incomeCount: 1,
          totalIncome: 30000,
        },
      },
      savings: {
        metrics: {
          savingsRate: {
            rate: 22,
            status: 'Strong',
          },
          totalSavings: 6600,
        },
      },
    }

    const { candidates, coverage, state } = buildCandidateSections({
      insightBundle: bundle,
      recommendationBundle: { recommendations: [] },
    })

    expect(state).toBe('ready')
    expect(coverage.current).toBe('available')

    const cashCand = candidates.find((c) => c.key === 'position_cash')
    expect(cashCand).toBeDefined()
    expect(cashCand.variables).toEqual({ remainingCash: '₱4,500' })
    expect(cashCand.evidence).toEqual([
      { label: 'Remaining Cash', source: 'cashflow.metrics.remainingCash', value: 4500 },
    ])

    const catCand = candidates.find((c) => c.key === 'position_top_category')
    expect(catCand).toBeDefined()
    expect(catCand.variables).toEqual({ category: 'Food' })

    const savingsCand = candidates.find((c) => c.key === 'position_savings_rate')
    expect(savingsCand).toBeDefined()
    expect(savingsCand.variables).toEqual({ savingsRate: '22%' })
    expect(savingsCand.evidence).toEqual([
      { label: 'Savings Rate', source: 'savings.metrics.savingsRate.rate', value: 22 },
    ])
  })

  it('omits top category if categoryName is missing or empty (Correction 4)', () => {
    const bundle = {
      expenses: {
        metrics: {
          expenseCount: 1,
          topSpendingCategory: {
            amount: 100,
            categoryName: '',
          },
          totalExpenses: 100,
        },
      },
    }

    const { candidates } = buildCandidateSections({
      insightBundle: bundle,
      recommendationBundle: { recommendations: [] },
    })

    const catCand = candidates.find((c) => c.key === 'position_top_category')
    expect(catCand).toBeUndefined()
  })

  it('reuses RuleResult severity from breakdown for rule-based risks (Correction 2)', () => {
    const bundle = {
      cashflow: {
        breakdown: [
          { id: 'cashflow_remaining_cash', severity: 'critical', status: 'fail' },
          { id: 'cashflow_spending_pace', severity: 'warning', status: 'fail' },
        ],
        metrics: {
          position: 'Negative',
          remainingCash: -500,
          spendingPace: { status: 'Fast' },
        },
      },
    }

    const { candidates } = buildCandidateSections({
      insightBundle: bundle,
      recommendationBundle: { recommendations: [] },
    })

    const cashRisk = candidates.find((c) => c.key === 'risk_cashflow_negative')
    expect(cashRisk).toBeDefined()
    expect(cashRisk.severity).toBe('critical')

    const paceRisk = candidates.find((c) => c.key === 'risk_spending_pace_fast')
    expect(paceRisk).toBeDefined()
    expect(paceRisk.severity).toBe('warning')
  })

  it('assigns null severity to comparison/trend risks without fabricating severity (Correction 2)', () => {
    const bundle = {
      cutoff: {
        metrics: {
          previousCutoffComparison: {
            expenses: {
              currentTotal: 5000,
              difference: 2000,
              direction: 'Increasing',
              percentageChange: 66.67,
            },
          },
          trend: {
            cutoffsCompared: 3,
            direction: 'Decreasing',
          },
        },
      },
      expenses: {
        metrics: {
          expenseCount: 2,
          totalExpenses: 5000,
        },
      },
    }

    const { candidates, coverage } = buildCandidateSections({
      insightBundle: bundle,
      recommendationBundle: { recommendations: [] },
    })

    expect(coverage.historical).toBe('available')

    const expenseIncreaseRisk = candidates.find((c) => c.key === 'prev_cutoff_expenses')
    expect(expenseIncreaseRisk).toBeDefined()
    expect(expenseIncreaseRisk.sectionType).toBe('risks')
    expect(expenseIncreaseRisk.severity).toBeNull()

    const trendRisk = candidates.find((c) => c.key === 'cutoff_trend')
    expect(trendRisk).toBeDefined()
    expect(trendRisk.sectionType).toBe('risks')
    expect(trendRisk.severity).toBeNull()
  })

  it('gating: monthly comparison requires non-null months and valid direction', () => {
    const bundleWithNoData = {
      income: {
        metrics: {
          monthlyComparison: {
            currentMonth: '2026-06',
            direction: 'No Data',
            percentageChange: 0,
            previousMonth: '2026-05',
          },
          totalIncome: 10000,
        },
      },
    }

    const res1 = buildCandidateSections({
      insightBundle: bundleWithNoData,
      recommendationBundle: { recommendations: [] },
    })
    expect(res1.coverage.monthly).toBe('unavailable')

    const bundleWithValidMonthly = {
      income: {
        metrics: {
          monthlyComparison: {
            currentMonth: '2026-06',
            direction: 'Increasing',
            percentageChange: 15,
            previousMonth: '2026-05',
          },
          totalIncome: 10000,
        },
      },
    }

    const res2 = buildCandidateSections({
      insightBundle: bundleWithValidMonthly,
      recommendationBundle: { recommendations: [] },
    })
    expect(res2.coverage.monthly).toBe('available')
    const monthlyHighlight = res2.candidates.find((c) => c.key === 'income_monthly_comparison')
    expect(monthlyHighlight).toBeDefined()
    expect(monthlyHighlight.sectionType).toBe('highlights')
  })

  it('does not mutate input bundles', () => {
    const bundle = Object.freeze({
      cashflow: Object.freeze({
        metrics: Object.freeze({
          position: 'Positive',
          remainingCash: 1000,
        }),
      }),
    })
    const recBundle = Object.freeze({
      recommendations: Object.freeze([]),
    })

    expect(() => {
      buildCandidateSections({ insightBundle: bundle, recommendationBundle: recBundle })
    }).not.toThrow()
  })
})
