import {
  RISK_LEVELS,
  RISK_SIGNAL_CODES,
} from '../constants/budgetShockConstants.js'

const currencyFormatter = new Intl.NumberFormat('en-PH', {
  currency: 'PHP',
  style: 'currency',
})

function formatMoney(amount) {
  return currencyFormatter.format(Number(amount) || 0)
}

export function generateRecommendation(riskResult, forecast = null) {
  if (!riskResult || typeof riskResult !== 'object') {
    return null
  }

  const { level, primaryReasonCode, cutoffId, projectedDeficit = 0 } = riskResult

  if (level === RISK_LEVELS.green) {
    return null
  }

  let title = 'Budget Shock Warning'
  let explanation = ''
  let recommendedAction = ''
  let severity = 'info'
  let priority = 'medium'

  switch (primaryReasonCode) {
    case RISK_SIGNAL_CODES.PROJECTED_DEFICIT:
    case RISK_SIGNAL_CODES.NEGATIVE_AVAILABLE_CASH:
      title = 'Projected Deficit Warning'
      explanation = projectedDeficit > 0
        ? `Current spending pace projects a cutoff shortfall of ${formatMoney(projectedDeficit)}.`
        : 'Available cash is currently negative for this cutoff.'
      recommendedAction =
        'Review remaining cutoff expenses and reduce discretionary spending where possible to address the projected shortfall.'
      severity = 'critical'
      priority = 'urgent'
      break

    case RISK_SIGNAL_CODES.CATEGORY_OVER_BUDGET:
      title = 'Category Budget Overage'
      explanation = 'Category spending has exceeded its planned budget for this cutoff.'
      recommendedAction =
        'Review remaining cutoff expenses and reduce discretionary spending where possible to address the category budget overage.'
      severity = 'critical'
      priority = 'urgent'
      break

    case RISK_SIGNAL_CODES.BURN_EXCEEDS_SAFE:
      title = 'Burn Rate Exceeds Safe Daily Spend'
      explanation = 'Current daily burn rate is above the safe daily spend for this cutoff.'
      recommendedAction =
        'Keep discretionary daily spending at or below the current safe daily spend for the remaining cutoff days.'
      severity = 'warning'
      priority = 'high'
      break

    case RISK_SIGNAL_CODES.CATEGORY_BUDGET_WARNING:
      title = 'Category Budget Warning'
      explanation = 'Category spending has reached at least 80% of its planned budget.'
      recommendedAction =
        'Review additional spending in the category that reached the budget warning threshold.'
      severity = 'warning'
      priority = 'high'
      break

    case RISK_SIGNAL_CODES.BURN_NEAR_SAFE:
      title = 'Spending Burn Monitor'
      explanation = 'Daily burn rate is within 10% of the safe daily allowance for this cutoff.'
      recommendedAction = 'Monitor spending for the remainder of the cutoff.'
      severity = 'info'
      priority = 'medium'
      break

    case RISK_SIGNAL_CODES.CATEGORY_BUDGET_WATCH:
      title = 'Category Budget Watch'
      explanation = 'Category spending has reached 70% of its planned allocation.'
      recommendedAction =
        'Review spending in the category approaching its planned budget.'
      severity = 'info'
      priority = 'medium'
      break

    default:
      if (level === RISK_LEVELS.red) {
        title = 'Projected Shortfall Warning'
        explanation = 'The cutoff is facing an impending budget shortfall.'
        recommendedAction =
          'Review remaining cutoff expenses and reduce discretionary spending where possible to address the projected shortfall.'
        severity = 'critical'
        priority = 'urgent'
      } else if (level === RISK_LEVELS.orange) {
        title = 'Overspending Risk'
        explanation = 'Expenses are accumulating faster than the sustainable cutoff pace.'
        recommendedAction =
          'Keep discretionary daily spending at or below the current safe daily spend for the remaining cutoff days.'
        severity = 'warning'
        priority = 'high'
      } else {
        title = 'Spending Monitor'
        explanation = 'Spending levels are approaching the upper threshold for this cutoff.'
        recommendedAction = 'Monitor spending for the remainder of the cutoff.'
        severity = 'info'
        priority = 'medium'
      }
  }

  const evidence = []
  if (forecast?.dailyBurnRate !== undefined) {
    evidence.push({ label: 'Daily Burn Rate', value: forecast.dailyBurnRate })
  }
  if (forecast?.safeDailySpend !== undefined) {
    evidence.push({ label: 'Safe Daily Spend', value: forecast.safeDailySpend })
  }
  if (projectedDeficit > 0) {
    evidence.push({ label: 'Projected Deficit', value: projectedDeficit })
  }

  return Object.freeze({
    id: `budget-shock-${level}-${cutoffId}`,
    domain: 'cashflow',
    actionKey: 'review_budget_shock',
    title,
    explanation,
    recommendedAction,
    severity,
    priority,
    evidence: Object.freeze(evidence),
  })
}

export const budgetShockRecommendationService = {
  generateRecommendation,
}
