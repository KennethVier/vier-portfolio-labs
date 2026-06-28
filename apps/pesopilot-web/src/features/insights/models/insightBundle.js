import { DEFAULT_INSIGHT_SCOPE } from '../utils/insightConstants.js'

export function createInsightBundle({ scope = DEFAULT_INSIGHT_SCOPE } = {}) {
  return {
    scope,
    generatedAt: new Date().toISOString(),
    health: null,
    income: null,
    expenses: null,
    savings: null,
    goals: null,
    cashflow: null,
    cutoff: null,
    recommendations: [],
    summary: null,
  }
}
