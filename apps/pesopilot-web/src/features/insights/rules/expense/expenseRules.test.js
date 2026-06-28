import { describe, expect, it } from 'vitest'

import { EXPENSE_RULE_STATUS } from '../../models/expenseRuleResult.js'
import { INSIGHT_SEVERITY } from '../../utils/insightSeverity.js'
import { EXPENSE_RULE_IDS, EXPENSE_RULE_WEIGHTS } from './expenseRuleConstants.js'
import {
  evaluateCategoryDistribution,
  evaluateDailySpendingRate,
  evaluateExpenseDecreaseDetection,
  evaluateExpenseExists,
  evaluateExpenseIncreaseDetection,
  evaluateExpenseTrend,
  evaluateLargestExpense,
  evaluateLargestMerchant,
  evaluateSpendingAnomalies,
  evaluateTopSpendingCategory,
} from './expenseRules.js'

function createContext(overrides = {}) {
  return {
    currentCutoff: {
      id: 1,
      name: 'Current',
    },
    previousCutoff: {
      id: 2,
      name: 'Previous',
    },
    metrics: {
      totalExpenses: 1000,
      expenseCount: 2,
      dailySpendingRate: 100,
      currentPeriodDays: 10,
      categoryDistribution: [
        {
          amount: 600,
          categoryId: 'food',
          categoryName: 'Food',
          count: 1,
          percentage: 60,
        },
        {
          amount: 400,
          categoryId: 'bills',
          categoryName: 'Bills',
          count: 1,
          percentage: 40,
        },
      ],
      topSpendingCategory: {
        amount: 600,
        categoryId: 'food',
        categoryName: 'Food',
        count: 1,
        percentage: 60,
      },
      largestExpense: {
        amount: 600,
        categoryId: 'food',
        categoryName: 'Food',
        date: '2026-06-10',
        id: 1,
        merchant: 'Jollibee',
      },
      largestMerchant: {
        amount: 600,
        count: 1,
        merchant: 'Jollibee',
      },
      trend: {
        direction: 'Increasing',
        currentTotal: 1000,
        comparisonTotal: 800,
        difference: 200,
        percentageChange: 25,
      },
      increase: {
        amount: 200,
        percentage: 25,
        significant: true,
      },
      decrease: null,
      anomalies: [],
    },
    ...overrides,
  }
}

describe('expense rules', () => {
  it('returns no data when there is no current cutoff', () => {
    const result = evaluateExpenseExists(
      createContext({ currentCutoff: null }),
      EXPENSE_RULE_WEIGHTS[EXPENSE_RULE_IDS.expenseExists],
    )

    expect(result.status).toBe(EXPENSE_RULE_STATUS.noData)
    expect(result.severity).toBe(INSIGHT_SEVERITY.info)
  })

  it('evaluates expense exists and empty expense records', () => {
    const passingResult = evaluateExpenseExists(
      createContext(),
      EXPENSE_RULE_WEIGHTS[EXPENSE_RULE_IDS.expenseExists],
    )
    const noDataResult = evaluateExpenseExists(
      createContext({
        metrics: {
          ...createContext().metrics,
          expenseCount: 0,
          totalExpenses: 0,
        },
      }),
      EXPENSE_RULE_WEIGHTS[EXPENSE_RULE_IDS.expenseExists],
    )

    expect(passingResult.status).toBe(EXPENSE_RULE_STATUS.pass)
    expect(noDataResult.status).toBe(EXPENSE_RULE_STATUS.noData)
  })

  it('evaluates category, expense, merchant, and daily rate rules', () => {
    const context = createContext()

    expect(
      evaluateTopSpendingCategory(
        context,
        EXPENSE_RULE_WEIGHTS[EXPENSE_RULE_IDS.topSpendingCategory],
      ).value.categoryName,
    ).toBe('Food')
    expect(
      evaluateCategoryDistribution(
        context,
        EXPENSE_RULE_WEIGHTS[EXPENSE_RULE_IDS.categoryDistribution],
      ).value,
    ).toHaveLength(2)
    expect(
      evaluateLargestExpense(
        context,
        EXPENSE_RULE_WEIGHTS[EXPENSE_RULE_IDS.largestExpense],
      ).value.merchant,
    ).toBe('Jollibee')
    expect(
      evaluateLargestMerchant(
        context,
        EXPENSE_RULE_WEIGHTS[EXPENSE_RULE_IDS.largestMerchant],
      ).value.merchant,
    ).toBe('Jollibee')
    expect(
      evaluateDailySpendingRate(
        context,
        EXPENSE_RULE_WEIGHTS[EXPENSE_RULE_IDS.dailySpendingRate],
      ).value,
    ).toBe(100)
  })

  it('evaluates trend, increase, decrease, and anomalies', () => {
    const context = createContext()
    const decreaseContext = createContext({
      metrics: {
        ...context.metrics,
        trend: {
          direction: 'Decreasing',
          currentTotal: 800,
          comparisonTotal: 1000,
          difference: -200,
          percentageChange: -20,
        },
        increase: null,
        decrease: {
          amount: 200,
          percentage: 20,
          significant: false,
        },
      },
    })
    const anomalyContext = createContext({
      metrics: {
        ...context.metrics,
        anomalies: [
          {
            amount: 1000,
            merchant: 'Meralco',
            threshold: 900,
          },
        ],
      },
    })

    expect(
      evaluateExpenseTrend(
        context,
        EXPENSE_RULE_WEIGHTS[EXPENSE_RULE_IDS.expenseTrend],
      ).status,
    ).toBe(EXPENSE_RULE_STATUS.warning)
    expect(
      evaluateExpenseIncreaseDetection(
        context,
        EXPENSE_RULE_WEIGHTS[EXPENSE_RULE_IDS.expenseIncreaseDetection],
      ).severity,
    ).toBe(INSIGHT_SEVERITY.critical)
    expect(
      evaluateExpenseDecreaseDetection(
        decreaseContext,
        EXPENSE_RULE_WEIGHTS[EXPENSE_RULE_IDS.expenseDecreaseDetection],
      ).severity,
    ).toBe(INSIGHT_SEVERITY.success)
    expect(
      evaluateSpendingAnomalies(
        anomalyContext,
        EXPENSE_RULE_WEIGHTS[EXPENSE_RULE_IDS.spendingAnomalies],
      ).severity,
    ).toBe(INSIGHT_SEVERITY.critical)
  })

  it('does not mutate normalized context', () => {
    const context = createContext()
    const before = JSON.stringify(context)

    evaluateCategoryDistribution(
      context,
      EXPENSE_RULE_WEIGHTS[EXPENSE_RULE_IDS.categoryDistribution],
    )
    evaluateExpenseTrend(
      context,
      EXPENSE_RULE_WEIGHTS[EXPENSE_RULE_IDS.expenseTrend],
    )
    evaluateSpendingAnomalies(
      context,
      EXPENSE_RULE_WEIGHTS[EXPENSE_RULE_IDS.spendingAnomalies],
    )

    expect(JSON.stringify(context)).toBe(before)
  })
})
