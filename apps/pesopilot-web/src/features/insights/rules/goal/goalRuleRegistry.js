import {
  evaluateContributionConsistency,
  evaluateGoalAggregation,
  evaluateGoalCompletion,
  evaluateGoalProgress,
  evaluateGoalsWithoutContributions,
  evaluateHighestFundedGoal,
  evaluateRemainingAmount,
} from './goalRules.js'
import { GOAL_RULE_IDS, GOAL_RULE_WEIGHTS } from './goalRuleConstants.js'

export const goalRuleRegistry = Object.freeze([
  {
    id: GOAL_RULE_IDS.goalAggregation,
    evaluate: evaluateGoalAggregation,
    weight: GOAL_RULE_WEIGHTS[GOAL_RULE_IDS.goalAggregation],
  },
  {
    id: GOAL_RULE_IDS.goalProgress,
    evaluate: evaluateGoalProgress,
    weight: GOAL_RULE_WEIGHTS[GOAL_RULE_IDS.goalProgress],
  },
  {
    id: GOAL_RULE_IDS.goalCompletion,
    evaluate: evaluateGoalCompletion,
    weight: GOAL_RULE_WEIGHTS[GOAL_RULE_IDS.goalCompletion],
  },
  {
    id: GOAL_RULE_IDS.remainingAmount,
    evaluate: evaluateRemainingAmount,
    weight: GOAL_RULE_WEIGHTS[GOAL_RULE_IDS.remainingAmount],
  },
  {
    id: GOAL_RULE_IDS.highestFundedGoal,
    evaluate: evaluateHighestFundedGoal,
    weight: GOAL_RULE_WEIGHTS[GOAL_RULE_IDS.highestFundedGoal],
  },
  {
    id: GOAL_RULE_IDS.goalsWithoutContributions,
    evaluate: evaluateGoalsWithoutContributions,
    weight: GOAL_RULE_WEIGHTS[GOAL_RULE_IDS.goalsWithoutContributions],
  },
  {
    id: GOAL_RULE_IDS.contributionConsistency,
    evaluate: evaluateContributionConsistency,
    weight: GOAL_RULE_WEIGHTS[GOAL_RULE_IDS.contributionConsistency],
  },
])

export { GOAL_RULE_IDS, GOAL_RULE_WEIGHTS }
