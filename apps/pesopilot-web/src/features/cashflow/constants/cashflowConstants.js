export const EMPTY_CASHFLOW_RESULT = Object.freeze({
  cashflow: null,
  hasCurrentCutoff: false,
})

export const EMPTY_FORECAST_RESULT = Object.freeze({
  forecast: null,
  explanation: null,
  hasCurrentCutoff: false,
})

export const EMPTY_CASHFLOW_AND_FORECAST_RESULT = Object.freeze({
  cashflow: null,
  forecast: null,
  explanation: null,
  hasCurrentCutoff: false,
})

export const CASHFLOW_METRICS = Object.freeze([
  { key: 'expectedIncome', label: 'Expected Income', format: 'currency' },
  { key: 'actualIncome', label: 'Actual Income', format: 'currency' },
  { key: 'totalExpenses', label: 'Expenses', format: 'currency' },
  { key: 'totalSavings', label: 'Savings', format: 'currency' },
  { key: 'remainingCash', label: 'Remaining Cash', format: 'currency' },
  { key: 'expenseRate', label: 'Expense Rate', format: 'percent' },
  { key: 'savingsRate', label: 'Savings Rate', format: 'percent' },
  { key: 'incomeVariance', label: 'Income Variance', format: 'currency' },
])
