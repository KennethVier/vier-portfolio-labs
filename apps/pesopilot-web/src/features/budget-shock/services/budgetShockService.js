import { cashflowService } from '@/features/cashflow/services/cashflowService.js'
import { cutoffService } from '@/features/salary-cutoff/services/cutoffService.js'
import { budgetRepository } from '@/lib/db/repositories/budgetRepository.js'

import { budgetShockAlertService } from './budgetShockAlertService.js'
import { budgetShockRecommendationService } from './budgetShockRecommendationService.js'
import { riskEngine } from './riskEngine.js'

const EMPTY_BUDGET_SHOCK_RESULT = Object.freeze({
  activeAlert: null,
  forecast: null,
  hasCurrentCutoff: false,
  recommendation: null,
  risk: null,
})

export const budgetShockService = {
  calculateRiskOnly(forecast, budgets = []) {
    return riskEngine.calculateRisk(forecast, budgets)
  },

  async evaluateBudgetShockForCutoff(cutoffId, asOfDate) {
    if (!cutoffId) {
      return EMPTY_BUDGET_SHOCK_RESULT
    }

    const forecastResult = await cashflowService.calculateForecastForCutoff(cutoffId, asOfDate)

    if (!forecastResult?.hasCurrentCutoff || !forecastResult?.forecast) {
      return EMPTY_BUDGET_SHOCK_RESULT
    }

    const forecast = forecastResult.forecast

    let budgets = []
    try {
      budgets = await budgetRepository.findByCutoff(cutoffId)
    } catch {
      budgets = []
    }

    const risk = riskEngine.calculateRisk(forecast, budgets)
    const recommendation = budgetShockRecommendationService.generateRecommendation(
      risk,
      forecast,
    )

    let activeAlert = null
    try {
      activeAlert = await budgetShockAlertService.synchronizeAlert({
        riskResult: risk,
        recommendation,
      })
    } catch {
      activeAlert = null
    }

    return {
      activeAlert,
      forecast,
      hasCurrentCutoff: true,
      recommendation,
      risk,
    }
  },

  async getCurrentBudgetShock(asOfDate) {
    const cutoff = await cutoffService.findCurrentCutoff(asOfDate)

    if (!cutoff) {
      return EMPTY_BUDGET_SHOCK_RESULT
    }

    return this.evaluateBudgetShockForCutoff(cutoff.id, asOfDate)
  },
}
