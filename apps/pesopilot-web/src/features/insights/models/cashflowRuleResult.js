import { INSIGHT_TYPES } from './insightTypes.js'

export const CASHFLOW_RULE_STATUS = Object.freeze({
  fail: 'fail',
  noData: 'no_data',
  pass: 'pass',
  warning: 'warning',
})

export function createCashflowRuleResult({
  domain = 'cashflow',
  evidence = [],
  id,
  message = '',
  passed = false,
  ruleName,
  score = 0,
  severity,
  status = CASHFLOW_RULE_STATUS.noData,
  value = null,
  weight = 0,
}) {
  return {
    id,
    ruleName,
    category: INSIGHT_TYPES.cashflow,
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
