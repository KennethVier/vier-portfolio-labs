export const GOAL_RULE_IDS = Object.freeze({
  contributionConsistency: 'contribution_consistency',
  goalAggregation: 'goal_aggregation',
  goalCompletion: 'goal_completion',
  goalProgress: 'goal_progress',
  goalsWithoutContributions: 'goals_without_contributions',
  highestFundedGoal: 'highest_funded_goal',
  remainingAmount: 'remaining_amount',
})

export const GOAL_RULE_WEIGHTS = Object.freeze({
  [GOAL_RULE_IDS.goalAggregation]: 15,
  [GOAL_RULE_IDS.goalProgress]: 20,
  [GOAL_RULE_IDS.goalCompletion]: 15,
  [GOAL_RULE_IDS.remainingAmount]: 15,
  [GOAL_RULE_IDS.highestFundedGoal]: 12,
  [GOAL_RULE_IDS.goalsWithoutContributions]: 10,
  [GOAL_RULE_IDS.contributionConsistency]: 13,
})
