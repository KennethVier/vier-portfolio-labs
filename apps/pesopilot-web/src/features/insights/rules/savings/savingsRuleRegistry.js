import {
  evaluateContributionFrequency,
  evaluateLargestSavingsContribution,
  evaluatePreviousCutoffComparison,
  evaluateSavingsConsistency,
  evaluateSavingsRate,
  evaluateSavingsTotal,
  evaluateSavingsTrend,
} from './savingsRules.js'
import { SAVINGS_RULE_IDS, SAVINGS_RULE_WEIGHTS } from './savingsRuleConstants.js'

export const savingsRuleRegistry = Object.freeze([
  {
    id: SAVINGS_RULE_IDS.savingsTotal,
    evaluate: evaluateSavingsTotal,
    weight: SAVINGS_RULE_WEIGHTS[SAVINGS_RULE_IDS.savingsTotal],
  },
  {
    id: SAVINGS_RULE_IDS.savingsRate,
    evaluate: evaluateSavingsRate,
    weight: SAVINGS_RULE_WEIGHTS[SAVINGS_RULE_IDS.savingsRate],
  },
  {
    id: SAVINGS_RULE_IDS.savingsTrend,
    evaluate: evaluateSavingsTrend,
    weight: SAVINGS_RULE_WEIGHTS[SAVINGS_RULE_IDS.savingsTrend],
  },
  {
    id: SAVINGS_RULE_IDS.previousCutoffComparison,
    evaluate: evaluatePreviousCutoffComparison,
    weight: SAVINGS_RULE_WEIGHTS[SAVINGS_RULE_IDS.previousCutoffComparison],
  },
  {
    id: SAVINGS_RULE_IDS.contributionFrequency,
    evaluate: evaluateContributionFrequency,
    weight: SAVINGS_RULE_WEIGHTS[SAVINGS_RULE_IDS.contributionFrequency],
  },
  {
    id: SAVINGS_RULE_IDS.largestSavingsContribution,
    evaluate: evaluateLargestSavingsContribution,
    weight: SAVINGS_RULE_WEIGHTS[SAVINGS_RULE_IDS.largestSavingsContribution],
  },
  {
    id: SAVINGS_RULE_IDS.savingsConsistency,
    evaluate: evaluateSavingsConsistency,
    weight: SAVINGS_RULE_WEIGHTS[SAVINGS_RULE_IDS.savingsConsistency],
  },
])

export { SAVINGS_RULE_IDS, SAVINGS_RULE_WEIGHTS }
