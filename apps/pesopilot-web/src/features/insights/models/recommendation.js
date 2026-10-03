export const RECOMMENDATION_DOMAINS = Object.freeze({
  cashflow: 'cashflow',
  cutoff: 'cutoff',
  expense: 'expense',
  goal: 'goal',
  health: 'health',
  income: 'income',
  savings: 'savings',
})

export function createRecommendation({
  actionKey = '',
  domain = '',
  evidence = [],
  explanation = '',
  id = '',
  priority = '',
  rank = null,
  severity = '',
  sourceRuleIds = [],
  title = '',
} = {}) {
  return {
    id,
    domain,
    actionKey,
    title,
    explanation,
    severity,
    priority,
    rank,
    evidence,
    sourceRuleIds,
  }
}
