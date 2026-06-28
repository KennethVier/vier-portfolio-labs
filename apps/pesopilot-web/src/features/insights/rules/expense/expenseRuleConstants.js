export const EXPENSE_RULE_IDS = Object.freeze({
  categoryDistribution: 'category_distribution',
  dailySpendingRate: 'daily_spending_rate',
  expenseDecreaseDetection: 'expense_decrease_detection',
  expenseExists: 'expense_exists',
  expenseIncreaseDetection: 'expense_increase_detection',
  expenseTrend: 'expense_trend',
  largestExpense: 'largest_expense',
  largestMerchant: 'largest_merchant',
  spendingAnomalies: 'spending_anomalies',
  topSpendingCategory: 'top_spending_category',
})

export const EXPENSE_RULE_WEIGHTS = Object.freeze({
  [EXPENSE_RULE_IDS.expenseExists]: 5,
  [EXPENSE_RULE_IDS.topSpendingCategory]: 10,
  [EXPENSE_RULE_IDS.categoryDistribution]: 10,
  [EXPENSE_RULE_IDS.largestExpense]: 8,
  [EXPENSE_RULE_IDS.largestMerchant]: 8,
  [EXPENSE_RULE_IDS.dailySpendingRate]: 10,
  [EXPENSE_RULE_IDS.expenseTrend]: 12,
  [EXPENSE_RULE_IDS.expenseIncreaseDetection]: 12,
  [EXPENSE_RULE_IDS.expenseDecreaseDetection]: 8,
  [EXPENSE_RULE_IDS.spendingAnomalies]: 12,
})
