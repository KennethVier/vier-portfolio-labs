import { describe, expect, it } from 'vitest'

import { HEALTH_STATUS } from '../../models/healthInsight.js'
import { HEALTH_RULE_STATUS, createHealthRuleResult } from '../../models/healthRuleResult.js'
import { INSIGHT_SCOPES } from '../../utils/insightConstants.js'
import { INSIGHT_SEVERITY } from '../../utils/insightSeverity.js'
import { aggregateHealthRules, getHealthStatus } from './healthAggregator.js'

function createRule({ id, ruleName, score, severity = INSIGHT_SEVERITY.success, weight }) {
  return createHealthRuleResult({
    domain: 'health',
    evidence: [
      {
        label: ruleName,
        value: score,
      },
    ],
    id,
    message: `${ruleName} message`,
    passed: score >= 80,
    ruleName,
    score,
    severity,
    status: score >= 80 ? HEALTH_RULE_STATUS.pass : HEALTH_RULE_STATUS.warning,
    weight,
  })
}

describe('health aggregation', () => {
  it('maps exact health status thresholds', () => {
    expect(getHealthStatus(90)).toBe(HEALTH_STATUS.excellent)
    expect(getHealthStatus(75)).toBe(HEALTH_STATUS.healthy)
    expect(getHealthStatus(60)).toBe(HEALTH_STATUS.fair)
    expect(getHealthStatus(40)).toBe(HEALTH_STATUS.needsAttention)
    expect(getHealthStatus(39)).toBe(HEALTH_STATUS.critical)
  })

  it('aggregates weighted scores, breakdown, evidence, strengths, and weaknesses', () => {
    const insight = aggregateHealthRules({
      scope: INSIGHT_SCOPES.currentCutoff,
      ruleResults: [
        createRule({
          id: 'income_availability',
          ruleName: 'Income Availability',
          score: 100,
          weight: 50,
        }),
        createRule({
          id: 'expense_ratio',
          ruleName: 'Expense Ratio',
          score: 40,
          severity: INSIGHT_SEVERITY.warning,
          weight: 50,
        }),
      ],
    })

    expect(insight.score).toBe(70)
    expect(insight.status).toBe(HEALTH_STATUS.fair)
    expect(insight.breakdown).toEqual([
      {
        id: 'income_availability',
        label: 'Income Availability',
        score: 100,
        weight: 50,
        contribution: 50,
        status: HEALTH_RULE_STATUS.pass,
        severity: INSIGHT_SEVERITY.success,
      },
      {
        id: 'expense_ratio',
        label: 'Expense Ratio',
        score: 40,
        weight: 50,
        contribution: 20,
        status: HEALTH_RULE_STATUS.warning,
        severity: INSIGHT_SEVERITY.warning,
      },
    ])
    expect(insight.evidence).toEqual([
      {
        ruleId: 'income_availability',
        label: 'Income Availability',
        value: 100,
      },
      {
        ruleId: 'expense_ratio',
        label: 'Expense Ratio',
        value: 40,
      },
    ])
    expect(insight.strengths).toEqual(['Income Availability message'])
    expect(insight.weaknesses).toEqual(['Expense Ratio message'])
    expect(insight.explanation).toContain('Financial health is Fair')
    expect(insight.diagnostics.executedRules).toEqual([
      'income_availability',
      'expense_ratio',
    ])
  })
})
