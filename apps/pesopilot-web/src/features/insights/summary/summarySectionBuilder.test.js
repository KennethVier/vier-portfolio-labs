import { describe, expect, it } from 'vitest'
import {
  buildCandidateSections,
  formatCurrency,
  formatPercent,
  hasSufficientFinancialData,
} from './summarySectionBuilder.js'
import { composeNarrative } from './narrativeComposer.js'
import { SUMMARY_SECTION_TYPES } from './summaryConstants.js'
import { CASHFLOW_RULE_IDS } from '../rules/cashflow/cashflowRuleConstants.js'
import { GOAL_RULE_IDS } from '../rules/goal/goalRuleConstants.js'
import { INCOME_RULE_IDS } from '../rules/income/incomeRuleConstants.js'
import { SAVINGS_RULE_IDS } from '../rules/savings/savingsRuleConstants.js'

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

  it('reuses RuleResult severity from actual Cashflow rule IDs and selects highest source severity deterministically', () => {
    const bundle = {
      cashflow: {
        breakdown: [
          { id: CASHFLOW_RULE_IDS.remainingCash, severity: 'warning', status: 'fail' },
          { id: CASHFLOW_RULE_IDS.netCashflow, severity: 'critical', status: 'fail' },
          { id: CASHFLOW_RULE_IDS.spendingPace, severity: 'warning', status: 'fail' },
          { id: CASHFLOW_RULE_IDS.incomeCoverage, severity: 'info', status: 'warning' },
          { id: CASHFLOW_RULE_IDS.cashflowStability, severity: 'warning', status: 'warning' },
        ],
        metrics: {
          incomeCoverage: { status: 'Uncovered' },
          position: 'Negative',
          remainingCash: -500,
          spendingPace: { status: 'Fast' },
          stability: { status: 'Strained' },
        },
      },
    }

    const { candidates } = buildCandidateSections({
      insightBundle: bundle,
      recommendationBundle: { recommendations: [] },
    })

    // Negative position matches remainingCash and netCashflow; picks highest ('critical' over 'warning')
    const cashRisk = candidates.find((c) => c.key === 'risk_cashflow_negative')
    expect(cashRisk).toBeDefined()
    expect(cashRisk.severity).toBe('critical')

    // Fast pace matches spendingPace
    const paceRisk = candidates.find((c) => c.key === 'risk_spending_pace_fast')
    expect(paceRisk).toBeDefined()
    expect(paceRisk.severity).toBe('warning')

    // Uncovered coverage matches incomeCoverage
    const covRisk = candidates.find((c) => c.key === 'risk_income_coverage_uncovered')
    expect(covRisk).toBeDefined()
    expect(covRisk.severity).toBe('info')

    // Strained stability matches cashflowStability
    const stabRisk = candidates.find((c) => c.key === 'risk_cashflow_stability')
    expect(stabRisk).toBeDefined()
    expect(stabRisk.severity).toBe('warning')
  })

  it('produces null severity when source RuleResult severity is missing (no invented fallbacks)', () => {
    const bundle = {
      cashflow: {
        breakdown: [
          { id: CASHFLOW_RULE_IDS.remainingCash, status: 'fail' },
          { id: CASHFLOW_RULE_IDS.spendingPace, status: 'fail' },
          { id: CASHFLOW_RULE_IDS.incomeCoverage, severity: null, status: 'warning' },
          { id: CASHFLOW_RULE_IDS.cashflowStability, status: 'warning' },
        ],
        metrics: {
          incomeCoverage: { status: 'Uncovered' },
          position: 'Negative',
          remainingCash: -500,
          spendingPace: { status: 'Fast' },
          stability: { status: 'Strained' },
        },
      },
      goals: {
        breakdown: [],
        metrics: {
          goalsWithoutContributions: ['goal_1'],
        },
      },
      income: {
        breakdown: [
          // Invented / non-matching rule ID
          { id: 'income_missing_income', severity: 'warning' },
        ],
        metrics: {
          missingIncome: { missing: true },
          stability: { status: 'Unstable' },
        },
      },
      savings: {
        breakdown: null,
        metrics: {
          savingsRate: { rate: 5, status: 'Low' },
        },
      },
    }

    const { candidates } = buildCandidateSections({
      insightBundle: bundle,
      recommendationBundle: { recommendations: [] },
    })

    const cashRisk = candidates.find((c) => c.key === 'risk_cashflow_negative')
    expect(cashRisk.severity).toBeNull()

    const paceRisk = candidates.find((c) => c.key === 'risk_spending_pace_fast')
    expect(paceRisk.severity).toBeNull()

    const covRisk = candidates.find((c) => c.key === 'risk_income_coverage_uncovered')
    expect(covRisk.severity).toBeNull()

    const stabRisk = candidates.find((c) => c.key === 'risk_cashflow_stability')
    expect(stabRisk.severity).toBeNull()

    const missingIncomeRisk = candidates.find((c) => c.key === 'risk_income_missing')
    expect(missingIncomeRisk.severity).toBeNull()

    const savingsRisk = candidates.find((c) => c.key === 'risk_savings_low')
    expect(savingsRisk.severity).toBeNull()

    const goalRisk = candidates.find((c) => c.key === 'risk_goals_no_contributions')
    expect(goalRisk.severity).toBeNull()
  })

  it('uses INCOME_RULE_IDS.missingIncomeDetection for missing income risk severity', () => {
    expect(INCOME_RULE_IDS.missingIncomeDetection).toBe('missing_income_detection')

    const bundle = {
      income: {
        breakdown: [
          { id: INCOME_RULE_IDS.missingIncomeDetection, severity: 'warning', status: 'fail' },
        ],
        metrics: {
          missingIncome: { missing: true },
          totalIncome: 10000,
        },
      },
    }

    const { candidates } = buildCandidateSections({
      insightBundle: bundle,
      recommendationBundle: { recommendations: [] },
    })

    const risk = candidates.find((c) => c.key === 'risk_income_missing')
    expect(risk).toBeDefined()
    expect(risk.severity).toBe('warning')
  })

  it('uses INCOME_RULE_IDS.incomeStability for income stability risk severity', () => {
    expect(INCOME_RULE_IDS.incomeStability).toBe('income_stability')

    const bundle = {
      income: {
        breakdown: [
          { id: INCOME_RULE_IDS.incomeStability, severity: 'warning', status: 'warning' },
        ],
        metrics: {
          stability: { status: 'Unstable' },
          totalIncome: 10000,
        },
      },
    }

    const { candidates } = buildCandidateSections({
      insightBundle: bundle,
      recommendationBundle: { recommendations: [] },
    })

    const risk = candidates.find((c) => c.key === 'risk_income_unstable')
    expect(risk).toBeDefined()
    expect(risk.severity).toBe('warning')
  })

  it('uses SAVINGS_RULE_IDS.savingsRate for savings rate risk severity', () => {
    expect(SAVINGS_RULE_IDS.savingsRate).toBe('savings_rate')

    const bundle = {
      savings: {
        breakdown: [
          { id: SAVINGS_RULE_IDS.savingsRate, severity: 'warning', status: 'warning' },
        ],
        metrics: {
          savingsRate: { rate: 5, status: 'Low' },
          totalSavings: 500,
        },
      },
    }

    const { candidates } = buildCandidateSections({
      insightBundle: bundle,
      recommendationBundle: { recommendations: [] },
    })

    const risk = candidates.find((c) => c.key === 'risk_savings_low')
    expect(risk).toBeDefined()
    expect(risk.severity).toBe('warning')
  })

  it('uses GOAL_RULE_IDS.goalsWithoutContributions for goals without contributions risk severity', () => {
    expect(GOAL_RULE_IDS.goalsWithoutContributions).toBe('goals_without_contributions')

    const bundle = {
      goals: {
        breakdown: [
          { id: GOAL_RULE_IDS.goalsWithoutContributions, severity: 'warning', status: 'warning' },
        ],
        metrics: {
          activeGoals: 1,
          goalsWithoutContributions: ['goal_emergency'],
          totalGoals: 1,
        },
      },
    }

    const { candidates } = buildCandidateSections({
      insightBundle: bundle,
      recommendationBundle: { recommendations: [] },
    })

    const risk = candidates.find((c) => c.key === 'risk_goals_no_contributions')
    expect(risk).toBeDefined()
    expect(risk.severity).toBe('warning')
  })

  it('reuses contributing Health RuleResult severity for Critical / Needs Attention health risk', () => {
    const bundle = {
      cashflow: { metrics: { remainingCash: 100 } },
      health: {
        breakdown: [
          { id: 'income_availability', severity: 'success', status: 'pass' },
          { id: 'expense_ratio', severity: 'warning', status: 'warning' },
          { id: 'remaining_cash', severity: 'critical', status: 'fail' },
        ],
        score: 30,
        status: 'Critical',
      },
    }

    const { candidates } = buildCandidateSections({
      insightBundle: bundle,
      recommendationBundle: { recommendations: [] },
    })

    const healthRisk = candidates.find((c) => c.key === 'risk_health_status')
    expect(healthRisk).toBeDefined()
    expect(healthRisk.severity).toBe('critical')

    const bundleNeedsAttention = {
      cashflow: { metrics: { remainingCash: 100 } },
      health: {
        breakdown: [
          { id: 'income_availability', severity: 'success', status: 'pass' },
          { id: 'expense_ratio', severity: 'warning', status: 'warning' },
        ],
        score: 55,
        status: 'Needs Attention',
      },
    }

    const res2 = buildCandidateSections({
      insightBundle: bundleNeedsAttention,
      recommendationBundle: { recommendations: [] },
    })
    const healthRisk2 = res2.candidates.find((c) => c.key === 'risk_health_status')
    expect(healthRisk2).toBeDefined()
    expect(healthRisk2.severity).toBe('warning')
  })

  it('health risk with no contributing negative severity remains null (does not manufacture severity)', () => {
    // Empty breakdown
    const res1 = buildCandidateSections({
      insightBundle: {
        cashflow: { metrics: { remainingCash: 100 } },
        health: { breakdown: [], score: 20, status: 'Critical' },
      },
      recommendationBundle: { recommendations: [] },
    })
    expect(res1.candidates.find((c) => c.key === 'risk_health_status').severity).toBeNull()

    // Negative item but missing severity string
    const res2 = buildCandidateSections({
      insightBundle: {
        cashflow: { metrics: { remainingCash: 100 } },
        health: {
          breakdown: [{ id: 'expense_ratio', severity: null, status: 'warning' }],
          score: 50,
          status: 'Needs Attention',
        },
      },
      recommendationBundle: { recommendations: [] },
    })
    expect(res2.candidates.find((c) => c.key === 'risk_health_status').severity).toBeNull()

    // Breakdown only contains passing items
    const res3 = buildCandidateSections({
      insightBundle: {
        cashflow: { metrics: { remainingCash: 100 } },
        health: {
          breakdown: [{ id: 'income_availability', severity: 'success', status: 'pass' }],
          score: 35,
          status: 'Critical',
        },
      },
      recommendationBundle: { recommendations: [] },
    })
    expect(res3.candidates.find((c) => c.key === 'risk_health_status').severity).toBeNull()
  })

  it('assigns null severity to comparison/trend risks without fabricating severity', () => {
    const bundle = {
      cutoff: {
        metrics: {
          averageComparison: {
            monthCount: 3,
            remainingCash: { direction: 'Decreasing', percentageChange: -25 },
          },
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
      income: {
        metrics: {
          monthlyComparison: {
            currentMonth: '2026-06',
            direction: 'Decreasing',
            percentageChange: -10,
            previousMonth: '2026-05',
          },
          totalIncome: 10000,
        },
      },
    }

    const { candidates, coverage } = buildCandidateSections({
      insightBundle: bundle,
      recommendationBundle: { recommendations: [] },
    })

    expect(coverage.historical).toBe('available')
    expect(coverage.monthly).toBe('available')

    const monthlyIncomeRisk = candidates.find((c) => c.key === 'income_monthly_comparison')
    expect(monthlyIncomeRisk).toBeDefined()
    expect(monthlyIncomeRisk.sectionType).toBe('risks')
    expect(monthlyIncomeRisk.severity).toBeNull()

    const avgRisk = candidates.find((c) => c.key === 'cutoff_avg_remainingCash')
    expect(avgRisk).toBeDefined()
    expect(avgRisk.sectionType).toBe('risks')
    expect(avgRisk.severity).toBeNull()

    const expenseIncreaseRisk = candidates.find((c) => c.key === 'prev_cutoff_expenses')
    expect(expenseIncreaseRisk).toBeDefined()
    expect(expenseIncreaseRisk.sectionType).toBe('risks')
    expect(expenseIncreaseRisk.severity).toBeNull()

    const trendRisk = candidates.find((c) => c.key === 'cutoff_trend')
    expect(trendRisk).toBeDefined()
    expect(trendRisk.sectionType).toBe('risks')
    expect(trendRisk.severity).toBeNull()
  })

  it('deterministic ordering still works with source-derived severities', () => {
    const bundle = {
      cashflow: {
        breakdown: [
          { id: CASHFLOW_RULE_IDS.remainingCash, severity: 'critical', status: 'fail' },
          { id: CASHFLOW_RULE_IDS.spendingPace, severity: 'warning', status: 'fail' },
        ],
        metrics: {
          position: 'Negative',
          remainingCash: -500,
          spendingPace: { status: 'Fast' },
        },
      },
      income: {
        breakdown: [
          { id: INCOME_RULE_IDS.missingIncomeDetection, severity: 'warning', status: 'fail' },
        ],
        metrics: {
          missingIncome: { missing: true },
          totalIncome: 10000,
        },
      },
      cutoff: {
        metrics: {
          trend: {
            cutoffsCompared: 3,
            direction: 'Decreasing',
          },
        },
      },
    }

    const { candidates } = buildCandidateSections({
      insightBundle: bundle,
      recommendationBundle: { recommendations: [] },
    })

    const { sections } = composeNarrative({ candidates })
    const riskSection = sections.find((s) => s.type === SUMMARY_SECTION_TYPES.risks)
    expect(riskSection).toBeDefined()

    // Explicit critical first, then warnings by domain order (cashflow before income), then unclassified null severity
    expect(riskSection.paragraphs.map((p) => p.key)).toEqual([
      'risk_cashflow_negative',
      'risk_spending_pace_fast',
      'risk_income_missing',
      'cutoff_trend',
    ])
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
