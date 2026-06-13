export const EMPTY_CASHFLOW_RESULT = {
  cashflow: null,
  hasCurrentCutoff: false,
}

export const CASHFLOW_METRICS = [
  { key: 'expectedIncome', label: 'Expected Income', format: 'currency' },
  { key: 'actualIncome', label: 'Actual Income', format: 'currency' },
  { key: 'totalExpenses', label: 'Expenses', format: 'currency' },
  { key: 'totalSavings', label: 'Savings', format: 'currency' },
  { key: 'remainingCash', label: 'Remaining Cash', format: 'currency' },
  { key: 'expenseRate', label: 'Expense Rate', format: 'percent' },
  { key: 'savingsRate', label: 'Savings Rate', format: 'percent' },
  { key: 'incomeVariance', label: 'Income Variance', format: 'currency' },
]
