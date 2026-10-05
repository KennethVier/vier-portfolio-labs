import { RISK_LEVELS, RISK_SCORES } from '../constants/budgetShockConstants.js'

export function createRiskSignal({ code, level, observed, threshold }) {
  if (!code || typeof code !== 'string') {
    throw new Error('Risk signal requires a valid code string')
  }

  if (!Object.values(RISK_LEVELS).includes(level)) {
    throw new Error(`Risk signal requires a valid level, received: ${level}`)
  }

  return Object.freeze({
    code,
    level,
    observed: observed ?? null,
    threshold: threshold ?? null,
  })
}

export function createRiskResult(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('RiskResult data must be a non-null object')
  }

  const {
    cutoffId,
    asOfDate,
    level = RISK_LEVELS.green,
    score = RISK_SCORES[level] ?? 0,
    primaryReasonCode = null,
    causeCategoryId = null,
    projectedDeficit = 0,
    signals = [],
  } = data

  if (cutoffId === null || cutoffId === undefined || cutoffId === '') {
    throw new Error('RiskResult requires a valid cutoffId')
  }

  if (!asOfDate || typeof asOfDate !== 'string') {
    throw new Error(`RiskResult requires a valid asOfDate string, received: ${asOfDate}`)
  }

  if (!Object.values(RISK_LEVELS).includes(level)) {
    throw new Error(`RiskResult requires a valid level, received: ${level}`)
  }

  const validatedSignals = Array.isArray(signals)
    ? signals.map((s) => (Object.isFrozen(s) ? s : createRiskSignal(s)))
    : []

  return Object.freeze({
    version: '1.0.0',
    cutoffId,
    asOfDate,
    level,
    score,
    primaryReasonCode,
    causeCategoryId,
    projectedDeficit: Math.max(0, Number(projectedDeficit) || 0),
    signals: Object.freeze(validatedSignals),
  })
}
