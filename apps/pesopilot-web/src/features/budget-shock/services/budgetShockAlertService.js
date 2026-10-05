import { budgetShockAlertRepository } from '@/lib/db/repositories/budgetShockAlertRepository.js'

import {
  ALERT_STATUS,
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

export function buildAlertMessage(riskResult) {
  if (!riskResult) {
    return ''
  }

  const { level, primaryReasonCode, projectedDeficit = 0 } = riskResult

  switch (primaryReasonCode) {
    case RISK_SIGNAL_CODES.PROJECTED_DEFICIT:
      return `Current spending pace projects a cutoff shortfall of ${formatMoney(projectedDeficit)}.`

    case RISK_SIGNAL_CODES.NEGATIVE_AVAILABLE_CASH:
      return 'Available cash is currently negative for this cutoff.'

    case RISK_SIGNAL_CODES.CATEGORY_OVER_BUDGET:
      return 'Category spending has exceeded its planned budget for this cutoff.'

    case RISK_SIGNAL_CODES.BURN_EXCEEDS_SAFE:
      return 'Current daily burn rate is above the safe daily spend for this cutoff.'

    case RISK_SIGNAL_CODES.CATEGORY_BUDGET_WARNING:
      return 'Category spending has reached at least 80% of its planned budget.'

    default:
      if (level === RISK_LEVELS.red) {
        return projectedDeficit > 0
          ? `Current spending pace projects a cutoff shortfall of ${formatMoney(projectedDeficit)}.`
          : 'The cutoff is currently facing a projected budget shortfall.'
      }
      if (level === RISK_LEVELS.orange) {
        return 'Current spending pace indicates a risk of overspending.'
      }
      return ''
  }
}

function sortAlertsByPrecedence(alerts) {
  return [...alerts].sort((a, b) => {
    // 1. Active status first
    if (a.status !== b.status) {
      return a.status === ALERT_STATUS.active ? -1 : 1
    }
    // 2. Newer createdAt first (descending)
    const createdDiff = String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''))
    if (createdDiff !== 0) {
      return createdDiff
    }
    // 3. Higher ID first (descending)
    return (Number(b.id) || 0) - (Number(a.id) || 0)
  })
}

export const budgetShockAlertService = {
  buildAlertMessage,

  async synchronizeAlert({
    riskResult,
    recommendation = null,
    now = new Date().toISOString(),
    repository = budgetShockAlertRepository,
  }) {
    if (!riskResult?.cutoffId) {
      return null
    }

    const { cutoffId, level, causeCategoryId = null, projectedDeficit = 0 } = riskResult
    const isAlertLevel = level === RISK_LEVELS.orange || level === RISK_LEVELS.red

    const existingAlerts = await repository.findByCutoff(cutoffId)
    const sorted = sortAlertsByPrecedence(existingAlerts)
    const canonicalAlert = sorted.length > 0 ? sorted[0] : null

    if (isAlertLevel) {
      const message = buildAlertMessage(riskResult)
      const recommendedAction = recommendation?.recommendedAction ?? ''

      if (canonicalAlert) {
        // Update canonical alert (or reactivate resolved alert)
        const updatedFields = {
          level,
          message,
          causeCategoryId,
          projectedDeficit,
          recommendedAction,
          status: ALERT_STATUS.active,
          resolvedAt: null,
        }

        await repository.update(canonicalAlert.id, updatedFields)

        // Resolve any other active alerts for this cutoff (legacy duplicates)
        const otherActive = existingAlerts.filter(
          (a) => a.id !== canonicalAlert.id && a.status === ALERT_STATUS.active,
        )
        for (const duplicate of otherActive) {
          await repository.update(duplicate.id, {
            status: ALERT_STATUS.resolved,
            resolvedAt: now,
          })
        }

        return {
          ...canonicalAlert,
          ...updatedFields,
        }
      }

      // Create new active alert
      const alertData = {
        cutoffId,
        level,
        message,
        causeCategoryId,
        projectedDeficit,
        recommendedAction,
        status: ALERT_STATUS.active,
        createdAt: now,
        resolvedAt: null,
      }

      const created = await repository.create(alertData)
      return created ?? alertData
    }

    // Risk level is Green or Yellow: resolve all currently active alerts (including legacy duplicates)
    const activeAlerts = existingAlerts.filter((a) => a.status === ALERT_STATUS.active)
    let lastResolved = null

    for (const active of activeAlerts) {
      const resolveFields = {
        status: ALERT_STATUS.resolved,
        resolvedAt: now,
      }

      await repository.update(active.id, resolveFields)
      lastResolved = {
        ...active,
        ...resolveFields,
      }
    }

    return lastResolved
  },

  async getActiveAlert(cutoffId, repository = budgetShockAlertRepository) {
    if (!cutoffId) {
      return null
    }

    const alerts = await repository.findByCutoff(cutoffId)
    const activeAlerts = alerts.filter((a) => a.status === ALERT_STATUS.active)
    if (activeAlerts.length === 0) {
      return null
    }

    return sortAlertsByPrecedence(activeAlerts)[0]
  },

  async getActiveAlerts(repository = budgetShockAlertRepository) {
    const alerts = await repository.findAll()
    const activeAlerts = alerts.filter((a) => a.status === ALERT_STATUS.active)
    const sorted = sortAlertsByPrecedence(activeAlerts)
    const seen = new Set()
    const deduped = []

    for (const alert of sorted) {
      if (!seen.has(alert.cutoffId)) {
        seen.add(alert.cutoffId)
        deduped.push(alert)
      }
    }

    return deduped
  },
}
