import { INSIGHT_TYPES } from './insightTypes.js'

export const EXPENSE_TREND = Object.freeze({
  decreasing: 'Decreasing',
  increasing: 'Increasing',
  noData: 'No Data',
  stable: 'Stable',
})

export function createEmptyExpenseMetrics() {
  return {
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
  }
}

export function createExpenseInsight({
  breakdown = [],
  diagnostics = {
    executedRules: [],
    warnings: [],
  },
  evidence = [],
  explanation = '',
  generatedAt = new Date().toISOString(),
  metrics = createEmptyExpenseMetrics(),
  scope,
} = {}) {
  return {
    category: INSIGHT_TYPES.expense,
    scope,
    generatedAt,
    metrics,
    breakdown,
    evidence,
    explanation,
    diagnostics,
  }
}
