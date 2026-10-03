import { INSIGHT_TYPES } from './insightTypes.js'

export const CASHFLOW_POSITION = Object.freeze({
  balanced: 'Balanced',
  negative: 'Negative',
  noData: 'No Data',
  positive: 'Positive',
})

export const SPENDING_PACE_STATUS = Object.freeze({
  fast: 'Fast',
  noData: 'No Data',
  onPace: 'On Pace',
  slow: 'Slow',
})

export const COVERAGE_STATUS = Object.freeze({
  covered: 'Covered',
  noData: 'No Data',
  partial: 'Partial',
  uncovered: 'Uncovered',
})

export const CASHFLOW_STABILITY = Object.freeze({
  noData: 'No Data',
  stable: 'Stable',
  strained: 'Strained',
  unstable: 'Unstable',
})

export function createEmptyCashflowMetrics() {
  return {
    remainingCash: 0,
    netCashflow: 0,
    position: CASHFLOW_POSITION.noData,
    spendingPace: {
      status: SPENDING_PACE_STATUS.noData,
      dailySpendingRate: 0,
      elapsedDays: 0,
      totalDays: 0,
      elapsedPercent: 0,
      spendingPercent: 0,
      paceDelta: 0,
    },
    incomeCoverage: {
      status: COVERAGE_STATUS.noData,
      actualIncome: 0,
      requiredOutflows: 0,
      coveragePercent: 0,
    },
    savingsCoverage: {
      status: COVERAGE_STATUS.noData,
      availableAfterExpenses: 0,
      totalSavings: 0,
      coveragePercent: 0,
    },
    stability: {
      status: CASHFLOW_STABILITY.noData,
      reason: '',
    },
  }
}

export function createCashflowInsight({
  breakdown = [],
  diagnostics = {
    executedRules: [],
    warnings: [],
  },
  evidence = [],
  explanation = '',
  generatedAt = new Date().toISOString(),
  metrics = createEmptyCashflowMetrics(),
  scope,
} = {}) {
  return {
    category: INSIGHT_TYPES.cashflow,
    scope,
    generatedAt,
    metrics,
    breakdown,
    evidence,
    explanation,
    diagnostics,
  }
}
