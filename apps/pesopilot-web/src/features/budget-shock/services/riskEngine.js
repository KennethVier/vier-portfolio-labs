import {
  RISK_LEVELS,
  RISK_SCORES,
  RISK_SIGNAL_CODES,
  SIGNAL_PRECEDENCE_ORDER,
  THRESHOLD_CONSTANTS,
} from '../constants/budgetShockConstants.js'
import { createRiskResult, createRiskSignal } from '../models/riskResultModel.js'

function isValidNumber(value) {
  return typeof value === 'number' && Number.isFinite(value)
}

function evaluateCategoryBudgets(budgets = []) {
  const signals = []

  if (!Array.isArray(budgets) || budgets.length === 0) {
    return signals
  }

  for (const budget of budgets) {
    const planned = Number(budget?.plannedAmount)
    const spent = Number(budget?.spentAmountSnapshot)

    if (!isValidNumber(planned) || planned <= 0 || !isValidNumber(spent)) {
      continue
    }

    const utilizationRaw = spent / planned
    const categoryId = budget.categoryId ?? null

    if (utilizationRaw > THRESHOLD_CONSTANTS.categoryOverBudgetRatio) {
      signals.push({
        signal: createRiskSignal({
          code: RISK_SIGNAL_CODES.CATEGORY_OVER_BUDGET,
          level: RISK_LEVELS.red,
          observed: utilizationRaw,
          threshold: THRESHOLD_CONSTANTS.categoryOverBudgetRatio,
        }),
        categoryId,
        utilizationRaw,
      })
    } else if (utilizationRaw >= THRESHOLD_CONSTANTS.categoryWarningRatio) {
      signals.push({
        signal: createRiskSignal({
          code: RISK_SIGNAL_CODES.CATEGORY_BUDGET_WARNING,
          level: RISK_LEVELS.orange,
          observed: utilizationRaw,
          threshold: THRESHOLD_CONSTANTS.categoryWarningRatio,
        }),
        categoryId,
        utilizationRaw,
      })
    } else if (utilizationRaw >= THRESHOLD_CONSTANTS.categoryWatchRatio) {
      signals.push({
        signal: createRiskSignal({
          code: RISK_SIGNAL_CODES.CATEGORY_BUDGET_WATCH,
          level: RISK_LEVELS.yellow,
          observed: utilizationRaw,
          threshold: THRESHOLD_CONSTANTS.categoryWatchRatio,
        }),
        categoryId,
        utilizationRaw,
      })
    }
  }

  return signals
}

export function calculateRisk(forecast, budgets = []) {
  if (!forecast || typeof forecast !== 'object') {
    throw new Error('calculateRisk requires a valid forecast object')
  }

  const {
    cutoffId,
    asOfDate,
    remainingDays = 0,
    availableCash = 0,
    dailyBurnRate = 0,
    safeDailySpend = 0,
    projectedRemaining = 0,
    projectedDeficit = 0,
  } = forecast

  const allSignals = []
  let causeCategoryId = null

  // 1. Evaluate Red forecast signals
  if (projectedDeficit > 0 || projectedRemaining < 0) {
    allSignals.push({
      signal: createRiskSignal({
        code: RISK_SIGNAL_CODES.PROJECTED_DEFICIT,
        level: RISK_LEVELS.red,
        observed: projectedDeficit > 0 ? projectedDeficit : Math.abs(projectedRemaining),
        threshold: 0,
      }),
      categoryId: null,
    })
  }

  if (availableCash < 0) {
    allSignals.push({
      signal: createRiskSignal({
        code: RISK_SIGNAL_CODES.NEGATIVE_AVAILABLE_CASH,
        level: RISK_LEVELS.red,
        observed: availableCash,
        threshold: 0,
      }),
      categoryId: null,
    })
  }

  // 2. Evaluate burn rate signals (Orange vs Yellow)
  // Only valid when remainingDays > 0 AND safeDailySpend > 0
  if (remainingDays > 0 && safeDailySpend > 0) {
    if (dailyBurnRate > safeDailySpend) {
      allSignals.push({
        signal: createRiskSignal({
          code: RISK_SIGNAL_CODES.BURN_EXCEEDS_SAFE,
          level: RISK_LEVELS.orange,
          observed: dailyBurnRate,
          threshold: safeDailySpend,
        }),
        categoryId: null,
      })
    } else {
      const burnRatio = dailyBurnRate / safeDailySpend
      if (burnRatio > THRESHOLD_CONSTANTS.burnPressureYellowRatio && burnRatio <= 1.0) {
        allSignals.push({
          signal: createRiskSignal({
            code: RISK_SIGNAL_CODES.BURN_NEAR_SAFE,
            level: RISK_LEVELS.yellow,
            observed: burnRatio,
            threshold: THRESHOLD_CONSTANTS.burnPressureYellowRatio,
          }),
          categoryId: null,
        })
      }
    }
  }

  // 3. Evaluate optional category budgets
  const budgetSignals = evaluateCategoryBudgets(budgets)
  for (const item of budgetSignals) {
    allSignals.push(item)
  }

  // 4. Determine overall level by highest severity precedence
  let level = RISK_LEVELS.green

  const hasRed = allSignals.some((item) => item.signal.level === RISK_LEVELS.red)
  const hasOrange = allSignals.some((item) => item.signal.level === RISK_LEVELS.orange)
  const hasYellow = allSignals.some((item) => item.signal.level === RISK_LEVELS.yellow)

  if (hasRed) {
    level = RISK_LEVELS.red
  } else if (hasOrange) {
    level = RISK_LEVELS.orange
  } else if (hasYellow) {
    level = RISK_LEVELS.yellow
  }

  const score = RISK_SCORES[level]

  // 5. Select primaryReasonCode by strict precedence order
  let primaryReasonCode = null

  if (level !== RISK_LEVELS.green) {
    const levelSignals = allSignals.filter((item) => item.signal.level === level)

    // Sort by precedence order
    levelSignals.sort((a, b) => {
      const indexA = SIGNAL_PRECEDENCE_ORDER.indexOf(a.signal.code)
      const indexB = SIGNAL_PRECEDENCE_ORDER.indexOf(b.signal.code)
      const safeIndexA = indexA === -1 ? 999 : indexA
      const safeIndexB = indexB === -1 ? 999 : indexB

      if (safeIndexA !== safeIndexB) {
        return safeIndexA - safeIndexB
      }

      // If same code (e.g. two category budgets), highest utilization wins
      const utilDiff = (b.utilizationRaw ?? 0) - (a.utilizationRaw ?? 0)
      if (utilDiff !== 0) {
        return utilDiff
      }

      // If equal utilization occurs, stable tie-break by categoryId
      return String(a.categoryId ?? '').localeCompare(String(b.categoryId ?? ''))
    })

    if (levelSignals.length > 0) {
      primaryReasonCode = levelSignals[0].signal.code
      causeCategoryId = levelSignals[0].categoryId ?? null
    }
  }

  return createRiskResult({
    cutoffId,
    asOfDate,
    level,
    score,
    primaryReasonCode,
    causeCategoryId,
    projectedDeficit: Math.max(0, Number(projectedDeficit) || 0),
    signals: allSignals.map((item) => item.signal),
  })
}

export const riskEngine = {
  calculateRisk,
}
