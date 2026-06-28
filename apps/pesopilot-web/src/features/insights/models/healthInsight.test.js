import { describe, expect, it } from 'vitest'

import { INSIGHT_SCOPES } from '../utils/insightConstants.js'
import { INSIGHT_SEVERITY } from '../utils/insightSeverity.js'

import { createHealthInsight, HEALTH_STATUS } from './healthInsight.js'
import { createHealthRuleResult, HEALTH_RULE_STATUS } from './healthRuleResult.js'

function expectIsoString(value) {
  expect(typeof value).toBe('string')
  expect(Number.isNaN(Date.parse(value))).toBe(false)
  expect(new Date(value).toISOString()).toBe(value)
}

describe('health insight models', () => {
  it('creates a serializable HealthInsight with traceable metadata', () => {
    const insight = createHealthInsight({
      scope: INSIGHT_SCOPES.currentCutoff,
    })

    expect(insight).toEqual({
      category: 'health',
      scope: INSIGHT_SCOPES.currentCutoff,
      generatedAt: expect.any(String),
      score: 0,
      status: HEALTH_STATUS.critical,
      breakdown: [],
      strengths: [],
      weaknesses: [],
      evidence: [],
      explanation: '',
      diagnostics: {
        executedRules: [],
        warnings: [],
      },
    })
    expectIsoString(insight.generatedAt)
  })

  it('defines exact health status display values', () => {
    expect(HEALTH_STATUS).toEqual({
      critical: 'Critical',
      excellent: 'Excellent',
      fair: 'Fair',
      healthy: 'Healthy',
      needsAttention: 'Needs Attention',
    })
  })

  it('creates serializable health rule results with evidence arrays', () => {
    const result = createHealthRuleResult({
      domain: 'income',
      evidence: [
        {
          label: 'Current-Cutoff Income',
          value: 40000,
          description: 'Total income linked to the current cutoff.',
        },
      ],
      id: 'income_availability',
      ruleName: 'Income Availability',
      score: 100,
      severity: INSIGHT_SEVERITY.success,
      status: HEALTH_RULE_STATUS.pass,
      weight: 20,
    })

    expect(result).toEqual({
      id: 'income_availability',
      ruleName: 'Income Availability',
      category: 'health',
      domain: 'income',
      value: null,
      score: 100,
      status: HEALTH_RULE_STATUS.pass,
      severity: INSIGHT_SEVERITY.success,
      weight: 20,
      passed: false,
      evidence: [
        {
          label: 'Current-Cutoff Income',
          value: 40000,
          description: 'Total income linked to the current cutoff.',
        },
      ],
      message: '',
    })
  })
})
