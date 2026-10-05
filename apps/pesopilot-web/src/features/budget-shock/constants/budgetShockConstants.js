export const RISK_LEVELS = Object.freeze({
  green: 'green',
  yellow: 'yellow',
  orange: 'orange',
  red: 'red',
})

export const RISK_SCORES = Object.freeze({
  [RISK_LEVELS.green]: 0,
  [RISK_LEVELS.yellow]: 1,
  [RISK_LEVELS.orange]: 2,
  [RISK_LEVELS.red]: 3,
})

export const RISK_LABELS = Object.freeze({
  [RISK_LEVELS.green]: 'Healthy',
  [RISK_LEVELS.yellow]: 'Monitor Spending',
  [RISK_LEVELS.orange]: 'Likely Overspending',
  [RISK_LEVELS.red]: 'Projected Deficit',
})

export const RISK_SIGNAL_CODES = Object.freeze({
  PROJECTED_DEFICIT: 'PROJECTED_DEFICIT',
  NEGATIVE_AVAILABLE_CASH: 'NEGATIVE_AVAILABLE_CASH',
  CATEGORY_OVER_BUDGET: 'CATEGORY_OVER_BUDGET',
  BURN_EXCEEDS_SAFE: 'BURN_EXCEEDS_SAFE',
  CATEGORY_BUDGET_WARNING: 'CATEGORY_BUDGET_WARNING',
  BURN_NEAR_SAFE: 'BURN_NEAR_SAFE',
  CATEGORY_BUDGET_WATCH: 'CATEGORY_BUDGET_WATCH',
})

export const SIGNAL_PRECEDENCE_ORDER = Object.freeze([
  RISK_SIGNAL_CODES.PROJECTED_DEFICIT,
  RISK_SIGNAL_CODES.NEGATIVE_AVAILABLE_CASH,
  RISK_SIGNAL_CODES.CATEGORY_OVER_BUDGET,
  RISK_SIGNAL_CODES.BURN_EXCEEDS_SAFE,
  RISK_SIGNAL_CODES.CATEGORY_BUDGET_WARNING,
  RISK_SIGNAL_CODES.BURN_NEAR_SAFE,
  RISK_SIGNAL_CODES.CATEGORY_BUDGET_WATCH,
])

export const THRESHOLD_CONSTANTS = Object.freeze({
  burnPressureYellowRatio: 0.90,
  categoryWatchRatio: 0.70,
  categoryWarningRatio: 0.80,
  categoryOverBudgetRatio: 1.00,
})

export const ALERT_STATUS = Object.freeze({
  active: 'active',
  resolved: 'resolved',
})
