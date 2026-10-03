import {
  evaluateCashflowStability,
  evaluateIncomeCoverage,
  evaluateNetCashflow,
  evaluateRemainingCash,
  evaluateSavingsCoverage,
  evaluateSpendingPace,
} from './cashflowRules.js'
import {
  CASHFLOW_RULE_IDS,
  CASHFLOW_RULE_WEIGHTS,
} from './cashflowRuleConstants.js'

export const cashflowRuleRegistry = Object.freeze([
  {
    id: CASHFLOW_RULE_IDS.remainingCash,
    evaluate: evaluateRemainingCash,
    weight: CASHFLOW_RULE_WEIGHTS[CASHFLOW_RULE_IDS.remainingCash],
  },
  {
    id: CASHFLOW_RULE_IDS.netCashflow,
    evaluate: evaluateNetCashflow,
    weight: CASHFLOW_RULE_WEIGHTS[CASHFLOW_RULE_IDS.netCashflow],
  },
  {
    id: CASHFLOW_RULE_IDS.spendingPace,
    evaluate: evaluateSpendingPace,
    weight: CASHFLOW_RULE_WEIGHTS[CASHFLOW_RULE_IDS.spendingPace],
  },
  {
    id: CASHFLOW_RULE_IDS.incomeCoverage,
    evaluate: evaluateIncomeCoverage,
    weight: CASHFLOW_RULE_WEIGHTS[CASHFLOW_RULE_IDS.incomeCoverage],
  },
  {
    id: CASHFLOW_RULE_IDS.savingsCoverage,
    evaluate: evaluateSavingsCoverage,
    weight: CASHFLOW_RULE_WEIGHTS[CASHFLOW_RULE_IDS.savingsCoverage],
  },
  {
    id: CASHFLOW_RULE_IDS.cashflowStability,
    evaluate: evaluateCashflowStability,
    weight: CASHFLOW_RULE_WEIGHTS[CASHFLOW_RULE_IDS.cashflowStability],
  },
])

export { CASHFLOW_RULE_IDS, CASHFLOW_RULE_WEIGHTS }
