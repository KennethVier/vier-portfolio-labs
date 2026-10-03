import { INSIGHT_SEVERITY } from '../../utils/insightSeverity.js'

export const RECOMMENDATION_RULE_IDS = Object.freeze({
  cashflowNegativePosition: 'cashflow_negative_position',
  cashflowFastSpendingPace: 'cashflow_fast_spending_pace',
  cashflowIncomeCoverage: 'cashflow_income_coverage',
  expenseCategoryConcentration: 'expense_category_concentration',
  expenseRisingSpending: 'expense_rising_spending',
  incomeMissingIncome: 'income_missing_income',
  incomeUnstable: 'income_unstable',
  savingsLowRate: 'savings_low_rate',
  goalNoContributions: 'goal_no_contributions',
  cutoffExpensesUp: 'cutoff_expenses_up',
  cutoffCashTrendDown: 'cutoff_cash_trend_down',
  healthLowStatus: 'health_low_status',
})

export const RECOMMENDATION_ACTION_KEYS = Object.freeze({
  reviewCashPosition: 'review_cash_position',
  reviewSpendingPace: 'review_spending_pace',
  reviewUpcomingObligations: 'review_upcoming_obligations',
  reviewExpenses: 'review_expenses',
  reviewIncomeRecords: 'review_income_records',
  reviewIncomeVariability: 'review_income_variability',
  reviewSavingsAllocation: 'review_savings_allocation',
  reviewGoalContributions: 'review_goal_contributions',
  reviewFinancialHealth: 'review_financial_health',
})

export const SEVERITY_WEIGHT = Object.freeze({
  [INSIGHT_SEVERITY.critical]: 3,
  [INSIGHT_SEVERITY.warning]: 2,
  [INSIGHT_SEVERITY.info]: 1,
  [INSIGHT_SEVERITY.success]: 0,
})

export const DOMAINS_ORDER = Object.freeze([
  'cashflow',
  'cutoff',
  'expense',
  'income',
  'savings',
  'goal',
  'health',
])

export const CONTRADICTION_RULES = Object.freeze([
  {
    winnerActionKeys: [
      RECOMMENDATION_ACTION_KEYS.reviewCashPosition,
      RECOMMENDATION_ACTION_KEYS.reviewUpcomingObligations,
    ],
    winnerMinSeverity: INSIGHT_SEVERITY.critical,
    loserActionKeys: [
      RECOMMENDATION_ACTION_KEYS.reviewSavingsAllocation,
      RECOMMENDATION_ACTION_KEYS.reviewGoalContributions,
    ],
    reason: 'contradicted_by_cashflow',
  },
])
