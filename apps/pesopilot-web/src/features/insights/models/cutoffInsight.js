import { INSIGHT_TYPES } from './insightTypes.js'

export const CUTOFF_TREND = Object.freeze({
  decreasing: 'Decreasing',
  increasing: 'Increasing',
  noData: 'No Data',
  stable: 'Stable',
})

export function createEmptyCutoffComparison() {
  return {
    currentTotal: 0,
    comparisonTotal: 0,
    difference: 0,
    percentageChange: 0,
    direction: CUTOFF_TREND.noData,
  }
}

function createEmptyComparisonSet() {
  return {
    income: createEmptyCutoffComparison(),
    expenses: createEmptyCutoffComparison(),
    savings: createEmptyCutoffComparison(),
    remainingCash: createEmptyCutoffComparison(),
  }
}

export function createEmptyCutoffMetrics() {
  return {
    currentCutoff: null,
    previousCutoff: null,
    previousCutoffComparison: createEmptyComparisonSet(),
    averageComparison: {
      cutoffCount: 0,
      monthCount: 0,
      ...createEmptyComparisonSet(),
    },
    bestCutoff: null,
    worstCutoff: null,
    trend: {
      direction: CUTOFF_TREND.noData,
      basis: 'remainingCash',
      cutoffsCompared: 0,
    },
  }
}

export function createCutoffInsight({
  breakdown = [],
  diagnostics = {
    executedRules: [],
    warnings: [],
  },
  evidence = [],
  explanation = '',
  generatedAt = new Date().toISOString(),
  metrics = createEmptyCutoffMetrics(),
  scope,
} = {}) {
  return {
    category: INSIGHT_TYPES.cutoff,
    scope,
    generatedAt,
    metrics,
    breakdown,
    evidence,
    explanation,
    diagnostics,
  }
}
