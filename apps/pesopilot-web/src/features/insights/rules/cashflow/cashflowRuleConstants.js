export const CASHFLOW_RULE_IDS = Object.freeze({
  remainingCash: 'remaining_cash',
  netCashflow: 'net_cashflow',
  spendingPace: 'spending_pace',
  incomeCoverage: 'income_coverage',
  savingsCoverage: 'savings_coverage',
  cashflowStability: 'cashflow_stability',
})

export const CASHFLOW_RULE_WEIGHTS = Object.freeze({
  [CASHFLOW_RULE_IDS.remainingCash]: 20,
  [CASHFLOW_RULE_IDS.netCashflow]: 15,
  [CASHFLOW_RULE_IDS.spendingPace]: 20,
  [CASHFLOW_RULE_IDS.incomeCoverage]: 20,
  [CASHFLOW_RULE_IDS.savingsCoverage]: 10,
  [CASHFLOW_RULE_IDS.cashflowStability]: 15,
})
