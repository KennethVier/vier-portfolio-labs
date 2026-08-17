export const INCOME_RULE_IDS = Object.freeze({
  incomeSourceBreakdown: 'income_source_breakdown',
  incomeStability: 'income_stability',
  incomeTrend: 'income_trend',
  missingIncomeDetection: 'missing_income_detection',
  monthlyComparison: 'monthly_comparison',
  previousCutoffComparison: 'previous_cutoff_comparison',
  totalIncome: 'total_income',
})

export const INCOME_RULE_WEIGHTS = Object.freeze({
  [INCOME_RULE_IDS.totalIncome]: 15,
  [INCOME_RULE_IDS.incomeSourceBreakdown]: 12,
  [INCOME_RULE_IDS.previousCutoffComparison]: 15,
  [INCOME_RULE_IDS.monthlyComparison]: 12,
  [INCOME_RULE_IDS.incomeTrend]: 15,
  [INCOME_RULE_IDS.missingIncomeDetection]: 18,
  [INCOME_RULE_IDS.incomeStability]: 13,
})
