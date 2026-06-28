import { INSIGHT_TYPES } from './insightTypes.js'

export const HEALTH_STATUS = Object.freeze({
  critical: 'Critical',
  excellent: 'Excellent',
  fair: 'Fair',
  healthy: 'Healthy',
  needsAttention: 'Needs Attention',
})

export function createHealthInsight({
  breakdown = [],
  diagnostics = {
    executedRules: [],
    warnings: [],
  },
  evidence = [],
  explanation = '',
  generatedAt = new Date().toISOString(),
  scope,
  score = 0,
  status = HEALTH_STATUS.critical,
  strengths = [],
  weaknesses = [],
} = {}) {
  return {
    category: INSIGHT_TYPES.health,
    scope,
    generatedAt,
    score,
    status,
    breakdown,
    strengths,
    weaknesses,
    evidence,
    explanation,
    diagnostics,
  }
}
