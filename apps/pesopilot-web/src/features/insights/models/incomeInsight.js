import { INSIGHT_TYPES } from './insightTypes.js'

export const INCOME_TREND = Object.freeze({
  decreasing: 'Decreasing',
  increasing: 'Increasing',
  noData: 'No Data',
  stable: 'Stable',
})

export const INCOME_STABILITY = Object.freeze({
  insufficientHistory: 'Insufficient History',
  moderate: 'Moderate',
  noData: 'No Data',
  stable: 'Stable',
  unstable: 'Unstable',
})

function createEmptyComparison() {
  return {
    currentTotal: 0,
    comparisonTotal: 0,
    difference: 0,
    percentageChange: 0,
    direction: INCOME_TREND.noData,
  }
}

export function createEmptyIncomeMetrics() {
  return {
    totalIncome: 0,
    incomeCount: 0,
    averageIncome: 0,
    sourceBreakdown: [],
    primarySource: null,
    previousCutoffComparison: createEmptyComparison(),
    monthlyComparison: {
      currentMonth: null,
      previousMonth: null,
      currentTotal: 0,
      previousTotal: 0,
      difference: 0,
      percentageChange: 0,
      direction: INCOME_TREND.noData,
    },
    trend: createEmptyComparison(),
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
  }
}

export function createIncomeInsight({
  breakdown = [],
  diagnostics = {
    executedRules: [],
    warnings: [],
  },
  evidence = [],
  explanation = '',
  generatedAt = new Date().toISOString(),
  metrics = createEmptyIncomeMetrics(),
  scope,
} = {}) {
  return {
    category: INSIGHT_TYPES.income,
    scope,
    generatedAt,
    metrics,
    breakdown,
    evidence,
    explanation,
    diagnostics,
  }
}
