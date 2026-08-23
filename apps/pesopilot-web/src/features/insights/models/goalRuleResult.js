import { INSIGHT_TYPES } from './insightTypes.js'

export const GOAL_RULE_STATUS = Object.freeze({
  fail: 'fail',
  noData: 'no_data',
  pass: 'pass',
  warning: 'warning',
})

export function createGoalRuleResult({
  domain = 'goals',
  evidence = [],
  id,
  message = '',
  passed = false,
  ruleName,
  score = 0,
  severity,
  status = GOAL_RULE_STATUS.noData,
  value = null,
  weight = 0,
}) {
  return {
    id,
    ruleName,
    category: INSIGHT_TYPES.goal,
    domain,
    value,
    score,
    status,
    severity,
    weight,
    passed,
    evidence,
    message,
  }
}
