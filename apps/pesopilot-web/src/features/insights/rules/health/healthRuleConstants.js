export const HEALTH_RULE_IDS = Object.freeze({
  expenseRatio: 'expense_ratio',
  goalContributionParticipation: 'goal_contribution_participation',
  incomeAvailability: 'income_availability',
  remainingCash: 'remaining_cash',
  savingsRatio: 'savings_ratio',
})

export const HEALTH_RULE_WEIGHTS = Object.freeze({
  [HEALTH_RULE_IDS.incomeAvailability]: 20,
  [HEALTH_RULE_IDS.expenseRatio]: 20,
  [HEALTH_RULE_IDS.savingsRatio]: 25,
  [HEALTH_RULE_IDS.remainingCash]: 25,
  [HEALTH_RULE_IDS.goalContributionParticipation]: 10,
})
