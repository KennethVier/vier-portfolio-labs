import { INSIGHT_TYPES } from './insightTypes.js'

export const SAVINGS_TREND = Object.freeze({
  decreasing: 'Decreasing',
  increasing: 'Increasing',
  noData: 'No Data',
  stable: 'Stable',
})

export const SAVINGS_RATE_STATUS = Object.freeze({
  acceptable: 'Acceptable',
  low: 'Low',
  noData: 'No Data',
  strong: 'Strong',
})

export const SAVINGS_CONSISTENCY = Object.freeze({
  inconsistent: 'Inconsistent',
  insufficientHistory: 'Insufficient History',
  moderate: 'Moderate',
  noData: 'No Data',
  stable: 'Stable',
})

function createEmptyComparison() {
  return {
    currentTotal: 0,
    comparisonTotal: 0,
    difference: 0,
    percentageChange: 0,
    direction: SAVINGS_TREND.noData,
  }
}

export function createEmptySavingsMetrics() {
  return {
    totalSavings: 0,
    savingsCount: 0,
    averageContribution: 0,
    savingsRate: {
      rate: 0,
      totalIncome: 0,
      totalSavings: 0,
      status: SAVINGS_RATE_STATUS.noData,
    },
    trend: createEmptyComparison(),
    previousCutoffComparison: createEmptyComparison(),
    contributionFrequency: {
      contributionCount: 0,
      currentPeriodDays: 0,
      activeContributionDays: 0,
      contributionsPerWeek: 0,
    },
    largestSavingsContribution: null,
    consistency: {
      status: SAVINGS_CONSISTENCY.noData,
      contributionCount: 0,
      contributionDays: 0,
      variancePercent: null,
    },
  }
}

export function createSavingsInsight({
  breakdown = [],
  diagnostics = {
    executedRules: [],
    warnings: [],
  },
  evidence = [],
  explanation = '',
  generatedAt = new Date().toISOString(),
  metrics = createEmptySavingsMetrics(),
  scope,
} = {}) {
  return {
    category: INSIGHT_TYPES.savings,
    scope,
    generatedAt,
    metrics,
    breakdown,
    evidence,
    explanation,
    diagnostics,
  }
}
