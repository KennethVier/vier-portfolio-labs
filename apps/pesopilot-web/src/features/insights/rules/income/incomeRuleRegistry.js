import {
  evaluateIncomeSourceBreakdown,
  evaluateIncomeStability,
  evaluateIncomeTrend,
  evaluateMissingIncomeDetection,
  evaluateMonthlyComparison,
  evaluatePreviousCutoffComparison,
  evaluateTotalIncome,
} from './incomeRules.js'
import { INCOME_RULE_IDS, INCOME_RULE_WEIGHTS } from './incomeRuleConstants.js'

export const incomeRuleRegistry = Object.freeze([
  {
    id: INCOME_RULE_IDS.totalIncome,
    evaluate: evaluateTotalIncome,
    weight: INCOME_RULE_WEIGHTS[INCOME_RULE_IDS.totalIncome],
  },
  {
    id: INCOME_RULE_IDS.incomeSourceBreakdown,
    evaluate: evaluateIncomeSourceBreakdown,
    weight: INCOME_RULE_WEIGHTS[INCOME_RULE_IDS.incomeSourceBreakdown],
  },
  {
    id: INCOME_RULE_IDS.previousCutoffComparison,
    evaluate: evaluatePreviousCutoffComparison,
    weight: INCOME_RULE_WEIGHTS[INCOME_RULE_IDS.previousCutoffComparison],
  },
  {
    id: INCOME_RULE_IDS.monthlyComparison,
    evaluate: evaluateMonthlyComparison,
    weight: INCOME_RULE_WEIGHTS[INCOME_RULE_IDS.monthlyComparison],
  },
  {
    id: INCOME_RULE_IDS.incomeTrend,
    evaluate: evaluateIncomeTrend,
    weight: INCOME_RULE_WEIGHTS[INCOME_RULE_IDS.incomeTrend],
  },
  {
    id: INCOME_RULE_IDS.missingIncomeDetection,
    evaluate: evaluateMissingIncomeDetection,
    weight: INCOME_RULE_WEIGHTS[INCOME_RULE_IDS.missingIncomeDetection],
  },
  {
    id: INCOME_RULE_IDS.incomeStability,
    evaluate: evaluateIncomeStability,
    weight: INCOME_RULE_WEIGHTS[INCOME_RULE_IDS.incomeStability],
  },
])

export { INCOME_RULE_IDS, INCOME_RULE_WEIGHTS }
