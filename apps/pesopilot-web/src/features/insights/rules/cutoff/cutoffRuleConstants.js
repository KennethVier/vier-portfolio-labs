export const CUTOFF_RULE_IDS = Object.freeze({
  previousCutoffComparison: 'previous_cutoff_comparison',
  averageComparison: 'average_comparison',
  incomeComparison: 'income_comparison',
  expenseComparison: 'expense_comparison',
  savingsComparison: 'savings_comparison',
  bestWorstCutoff: 'best_worst_cutoff',
  cutoffTrend: 'cutoff_trend',
})

export const CUTOFF_RULE_WEIGHTS = Object.freeze({
  [CUTOFF_RULE_IDS.previousCutoffComparison]: 20,
  [CUTOFF_RULE_IDS.averageComparison]: 15,
  [CUTOFF_RULE_IDS.incomeComparison]: 15,
  [CUTOFF_RULE_IDS.expenseComparison]: 15,
  [CUTOFF_RULE_IDS.savingsComparison]: 10,
  [CUTOFF_RULE_IDS.bestWorstCutoff]: 10,
  [CUTOFF_RULE_IDS.cutoffTrend]: 15,
})
