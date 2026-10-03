import {
  evaluateAverageComparison,
  evaluateBestWorstCutoff,
  evaluateCutoffTrend,
  evaluateExpenseComparison,
  evaluateIncomeComparison,
  evaluatePreviousCutoffComparison,
  evaluateSavingsComparison,
} from './cutoffRules.js'
import { CUTOFF_RULE_IDS, CUTOFF_RULE_WEIGHTS } from './cutoffRuleConstants.js'

export const cutoffRuleRegistry = Object.freeze([
  {
    id: CUTOFF_RULE_IDS.previousCutoffComparison,
    evaluate: evaluatePreviousCutoffComparison,
    weight: CUTOFF_RULE_WEIGHTS[CUTOFF_RULE_IDS.previousCutoffComparison],
  },
  {
    id: CUTOFF_RULE_IDS.averageComparison,
    evaluate: evaluateAverageComparison,
    weight: CUTOFF_RULE_WEIGHTS[CUTOFF_RULE_IDS.averageComparison],
  },
  {
    id: CUTOFF_RULE_IDS.incomeComparison,
    evaluate: evaluateIncomeComparison,
    weight: CUTOFF_RULE_WEIGHTS[CUTOFF_RULE_IDS.incomeComparison],
  },
  {
    id: CUTOFF_RULE_IDS.expenseComparison,
    evaluate: evaluateExpenseComparison,
    weight: CUTOFF_RULE_WEIGHTS[CUTOFF_RULE_IDS.expenseComparison],
  },
  {
    id: CUTOFF_RULE_IDS.savingsComparison,
    evaluate: evaluateSavingsComparison,
    weight: CUTOFF_RULE_WEIGHTS[CUTOFF_RULE_IDS.savingsComparison],
  },
  {
    id: CUTOFF_RULE_IDS.bestWorstCutoff,
    evaluate: evaluateBestWorstCutoff,
    weight: CUTOFF_RULE_WEIGHTS[CUTOFF_RULE_IDS.bestWorstCutoff],
  },
  {
    id: CUTOFF_RULE_IDS.cutoffTrend,
    evaluate: evaluateCutoffTrend,
    weight: CUTOFF_RULE_WEIGHTS[CUTOFF_RULE_IDS.cutoffTrend],
  },
])

export { CUTOFF_RULE_IDS, CUTOFF_RULE_WEIGHTS }
