export const PESOPILOT_DB_NAME = 'pesopilot'
export const PESOPILOT_DB_VERSION = 2
export const DEFAULT_SETTINGS_ID = 'user-settings'

export const STORE_NAMES = {
  categories: 'categories',
  income: 'income',
  expenses: 'expenses',
  savings: 'savings',
  savingsGoals: 'savings_goals',
  salaryCutoffs: 'salary_cutoffs',
  budgets: 'budgets',
  detectedExpenses: 'detected_expenses',
  merchantRules: 'merchant_rules',
  aiInsights: 'ai_insights',
  cashflowSnapshots: 'cashflow_snapshots',
  budgetShockAlerts: 'budget_shock_alerts',
  settings: 'settings',
}

export const APPROVED_STORE_NAMES = Object.values(STORE_NAMES)

export const pesopilotSchemaV1 = {
  [STORE_NAMES.categories]: 'id, name, type',
  [STORE_NAMES.income]: '++id, cutoffId, date',
  [STORE_NAMES.expenses]: '++id, cutoffId, categoryId, merchant, date',
  [STORE_NAMES.savings]: '++id, cutoffId, date',
  [STORE_NAMES.salaryCutoffs]: '++id, type, startDate, endDate',
  [STORE_NAMES.budgets]: '++id, cutoffId, categoryId',
  [STORE_NAMES.detectedExpenses]: '++id, status, merchant',
  [STORE_NAMES.merchantRules]: '++id, keyword, categoryId',
  [STORE_NAMES.aiInsights]: '++id, type, cutoffId',
  [STORE_NAMES.cashflowSnapshots]: '++id, cutoffId',
  [STORE_NAMES.budgetShockAlerts]: '++id, cutoffId, level',
  [STORE_NAMES.settings]: 'id',
}

export const pesopilotSchemaV2 = {
  ...pesopilotSchemaV1,
  [STORE_NAMES.savings]: '++id, cutoffId, goalId, date',
  [STORE_NAMES.savingsGoals]: '++id, status, priority, targetDate',
}
