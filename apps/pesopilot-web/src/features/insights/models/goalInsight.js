import { INSIGHT_TYPES } from './insightTypes.js'

export const GOAL_CONSISTENCY = Object.freeze({
  consistent: 'Consistent',
  inconsistent: 'Inconsistent',
  moderate: 'Moderate',
  noData: 'No Data',
})

export function createEmptyGoalMetrics() {
  return {
    totalGoals: 0,
    activeGoals: 0,
    completedGoals: 0,
    totalTargetAmount: 0,
    totalSavedAmount: 0,
    overallCompletionRate: 0,
    highestFundedGoal: null,
    goalsWithoutContributions: [],
    goals: [],
  }
}

export function createGoalInsight({
  breakdown = [],
  diagnostics = {
    executedRules: [],
    warnings: [],
  },
  evidence = [],
  explanation = '',
  generatedAt = new Date().toISOString(),
  metrics = createEmptyGoalMetrics(),
  scope,
} = {}) {
  return {
    category: INSIGHT_TYPES.goal,
    scope,
    generatedAt,
    metrics,
    breakdown,
    evidence,
    explanation,
    diagnostics,
  }
}
