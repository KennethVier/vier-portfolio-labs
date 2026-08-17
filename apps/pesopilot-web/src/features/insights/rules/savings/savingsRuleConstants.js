export const SAVINGS_RULE_IDS = Object.freeze({
  contributionFrequency: 'contribution_frequency',
  largestSavingsContribution: 'largest_savings_contribution',
  previousCutoffComparison: 'previous_cutoff_comparison',
  savingsConsistency: 'savings_consistency',
  savingsRate: 'savings_rate',
  savingsTotal: 'savings_total',
  savingsTrend: 'savings_trend',
})

export const SAVINGS_RULE_WEIGHTS = Object.freeze({
  [SAVINGS_RULE_IDS.savingsTotal]: 15,
  [SAVINGS_RULE_IDS.savingsRate]: 20,
  [SAVINGS_RULE_IDS.savingsTrend]: 15,
  [SAVINGS_RULE_IDS.previousCutoffComparison]: 15,
  [SAVINGS_RULE_IDS.contributionFrequency]: 12,
  [SAVINGS_RULE_IDS.largestSavingsContribution]: 10,
  [SAVINGS_RULE_IDS.savingsConsistency]: 13,
})
