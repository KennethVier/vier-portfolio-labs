import {
  evaluateExpenseRatio,
  evaluateGoalContributionParticipation,
  evaluateIncomeAvailability,
  evaluateRemainingCash,
  evaluateSavingsRatio,
} from './healthRules.js'
import { HEALTH_RULE_IDS, HEALTH_RULE_WEIGHTS } from './healthRuleConstants.js'

export const healthRuleRegistry = Object.freeze([
  {
    id: HEALTH_RULE_IDS.incomeAvailability,
    evaluate: evaluateIncomeAvailability,
    weight: HEALTH_RULE_WEIGHTS[HEALTH_RULE_IDS.incomeAvailability],
  },
  {
    id: HEALTH_RULE_IDS.expenseRatio,
    evaluate: evaluateExpenseRatio,
    weight: HEALTH_RULE_WEIGHTS[HEALTH_RULE_IDS.expenseRatio],
  },
  {
    id: HEALTH_RULE_IDS.savingsRatio,
    evaluate: evaluateSavingsRatio,
    weight: HEALTH_RULE_WEIGHTS[HEALTH_RULE_IDS.savingsRatio],
  },
  {
    id: HEALTH_RULE_IDS.remainingCash,
    evaluate: evaluateRemainingCash,
    weight: HEALTH_RULE_WEIGHTS[HEALTH_RULE_IDS.remainingCash],
  },
  {
    id: HEALTH_RULE_IDS.goalContributionParticipation,
    evaluate: evaluateGoalContributionParticipation,
    weight: HEALTH_RULE_WEIGHTS[HEALTH_RULE_IDS.goalContributionParticipation],
  },
])

export { HEALTH_RULE_IDS, HEALTH_RULE_WEIGHTS }
