import { DEFAULT_INSIGHT_SCOPE } from '../utils/insightConstants.js'

export function createRecommendationBundle({
  generatedAt = new Date().toISOString(),
  groups = {
    cashflow: [],
    cutoff: [],
    expense: [],
    goal: [],
    health: [],
    income: [],
    savings: [],
  },
  recommendations = [],
  scope = DEFAULT_INSIGHT_SCOPE,
  suppressed = [],
} = {}) {
  return {
    scope,
    generatedAt,
    recommendations,
    groups,
    suppressed,
  }
}
