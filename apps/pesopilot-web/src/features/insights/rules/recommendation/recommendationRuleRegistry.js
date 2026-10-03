import {
  evaluateCashflowFastSpendingPace,
  evaluateCashflowIncomeCoverage,
  evaluateCashflowNegativePosition,
  evaluateCutoffCashTrendDown,
  evaluateCutoffExpensesUp,
  evaluateExpenseCategoryConcentration,
  evaluateExpenseRisingSpending,
  evaluateGoalNoContributions,
  evaluateHealthLowStatus,
  evaluateIncomeMissingIncome,
  evaluateIncomeUnstable,
  evaluateSavingsLowRate,
} from './recommendationRules.js'
import {
  RECOMMENDATION_ACTION_KEYS,
  RECOMMENDATION_RULE_IDS,
} from './recommendationRuleConstants.js'

export const recommendationRuleRegistry = Object.freeze([
  {
    id: RECOMMENDATION_RULE_IDS.cashflowNegativePosition,
    domain: 'cashflow',
    evaluate: evaluateCashflowNegativePosition,
  },
  {
    id: RECOMMENDATION_RULE_IDS.cashflowFastSpendingPace,
    domain: 'cashflow',
    evaluate: evaluateCashflowFastSpendingPace,
  },
  {
    id: RECOMMENDATION_RULE_IDS.cashflowIncomeCoverage,
    domain: 'cashflow',
    evaluate: evaluateCashflowIncomeCoverage,
  },
  {
    id: RECOMMENDATION_RULE_IDS.expenseCategoryConcentration,
    domain: 'expense',
    evaluate: evaluateExpenseCategoryConcentration,
  },
  {
    id: RECOMMENDATION_RULE_IDS.expenseRisingSpending,
    domain: 'expense',
    evaluate: evaluateExpenseRisingSpending,
  },
  {
    id: RECOMMENDATION_RULE_IDS.incomeMissingIncome,
    domain: 'income',
    evaluate: evaluateIncomeMissingIncome,
  },
  {
    id: RECOMMENDATION_RULE_IDS.incomeUnstable,
    domain: 'income',
    evaluate: evaluateIncomeUnstable,
  },
  {
    id: RECOMMENDATION_RULE_IDS.savingsLowRate,
    domain: 'savings',
    evaluate: evaluateSavingsLowRate,
  },
  {
    id: RECOMMENDATION_RULE_IDS.goalNoContributions,
    domain: 'goal',
    evaluate: evaluateGoalNoContributions,
  },
  {
    id: RECOMMENDATION_RULE_IDS.cutoffExpensesUp,
    domain: 'cutoff',
    evaluate: evaluateCutoffExpensesUp,
  },
  {
    id: RECOMMENDATION_RULE_IDS.cutoffCashTrendDown,
    domain: 'cutoff',
    evaluate: evaluateCutoffCashTrendDown,
  },
  {
    id: RECOMMENDATION_RULE_IDS.healthLowStatus,
    domain: 'health',
    evaluate: evaluateHealthLowStatus,
  },
])

export { RECOMMENDATION_RULE_IDS, RECOMMENDATION_ACTION_KEYS }
