import {
  evaluateCategoryDistribution,
  evaluateDailySpendingRate,
  evaluateExpenseDecreaseDetection,
  evaluateExpenseExists,
  evaluateExpenseIncreaseDetection,
  evaluateExpenseTrend,
  evaluateLargestExpense,
  evaluateLargestMerchant,
  evaluateSpendingAnomalies,
  evaluateTopSpendingCategory,
} from './expenseRules.js'
import { EXPENSE_RULE_IDS, EXPENSE_RULE_WEIGHTS } from './expenseRuleConstants.js'

export const expenseRuleRegistry = Object.freeze([
  {
    id: EXPENSE_RULE_IDS.expenseExists,
    evaluate: evaluateExpenseExists,
    weight: EXPENSE_RULE_WEIGHTS[EXPENSE_RULE_IDS.expenseExists],
  },
  {
    id: EXPENSE_RULE_IDS.topSpendingCategory,
    evaluate: evaluateTopSpendingCategory,
    weight: EXPENSE_RULE_WEIGHTS[EXPENSE_RULE_IDS.topSpendingCategory],
  },
  {
    id: EXPENSE_RULE_IDS.categoryDistribution,
    evaluate: evaluateCategoryDistribution,
    weight: EXPENSE_RULE_WEIGHTS[EXPENSE_RULE_IDS.categoryDistribution],
  },
  {
    id: EXPENSE_RULE_IDS.largestExpense,
    evaluate: evaluateLargestExpense,
    weight: EXPENSE_RULE_WEIGHTS[EXPENSE_RULE_IDS.largestExpense],
  },
  {
    id: EXPENSE_RULE_IDS.largestMerchant,
    evaluate: evaluateLargestMerchant,
    weight: EXPENSE_RULE_WEIGHTS[EXPENSE_RULE_IDS.largestMerchant],
  },
  {
    id: EXPENSE_RULE_IDS.dailySpendingRate,
    evaluate: evaluateDailySpendingRate,
    weight: EXPENSE_RULE_WEIGHTS[EXPENSE_RULE_IDS.dailySpendingRate],
  },
  {
    id: EXPENSE_RULE_IDS.expenseTrend,
    evaluate: evaluateExpenseTrend,
    weight: EXPENSE_RULE_WEIGHTS[EXPENSE_RULE_IDS.expenseTrend],
  },
  {
    id: EXPENSE_RULE_IDS.expenseIncreaseDetection,
    evaluate: evaluateExpenseIncreaseDetection,
    weight: EXPENSE_RULE_WEIGHTS[EXPENSE_RULE_IDS.expenseIncreaseDetection],
  },
  {
    id: EXPENSE_RULE_IDS.expenseDecreaseDetection,
    evaluate: evaluateExpenseDecreaseDetection,
    weight: EXPENSE_RULE_WEIGHTS[EXPENSE_RULE_IDS.expenseDecreaseDetection],
  },
  {
    id: EXPENSE_RULE_IDS.spendingAnomalies,
    evaluate: evaluateSpendingAnomalies,
    weight: EXPENSE_RULE_WEIGHTS[EXPENSE_RULE_IDS.spendingAnomalies],
  },
])

export { EXPENSE_RULE_IDS, EXPENSE_RULE_WEIGHTS }
