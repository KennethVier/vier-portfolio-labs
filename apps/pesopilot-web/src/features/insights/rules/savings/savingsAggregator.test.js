import { describe, expect, it } from 'vitest'

import { SAVINGS_RATE_STATUS } from '../../models/savingsInsight.js'
import { SAVINGS_RULE_STATUS } from '../../models/savingsRuleResult.js'
import { INSIGHT_SEVERITY } from '../../utils/insightSeverity.js'
import { SAVINGS_RULE_IDS } from './savingsRuleConstants.js'
import { aggregateSavingsRules } from './savingsAggregator.js'

describe('savings aggregator', () => {
  it('aggregates rule results into SavingsInsight evidence, breakdown, diagnostics, and explanation', () => {
    const insight = aggregateSavingsRules({
      context: {
        diagnostics: {
          warnings: ['No previous cutoff'],
        },
      },
      metrics: {
        savingsCount: 1,
        savingsRate: {
          rate: 20,
          status: SAVINGS_RATE_STATUS.strong,
        },
        trend: {
          direction: 'Increasing',
        },
        consistency: {
          status: 'Stable',
        },
      },
      ruleResults: [
        {
          id: SAVINGS_RULE_IDS.savingsTotal,
          ruleName: 'Savings Total',
          score: 100,
          status: SAVINGS_RULE_STATUS.pass,
          severity: INSIGHT_SEVERITY.success,
          weight: 15,
          evidence: [
            {
              label: 'Total Savings',
              value: 8000,
            },
          ],
        },
      ],
      scope: 'current_cutoff',
    })

    expect(insight).toMatchObject({
      category: 'savings',
      scope: 'current_cutoff',
      breakdown: [
        {
          id: SAVINGS_RULE_IDS.savingsTotal,
          label: 'Savings Total',
          score: 100,
          status: SAVINGS_RULE_STATUS.pass,
          severity: INSIGHT_SEVERITY.success,
          weight: 15,
        },
      ],
      diagnostics: {
        executedRules: [SAVINGS_RULE_IDS.savingsTotal],
        warnings: ['No previous cutoff'],
      },
      evidence: [
        {
          ruleId: SAVINGS_RULE_IDS.savingsTotal,
          label: 'Total Savings',
          value: 8000,
        },
      ],
    })
    expect(insight.explanation).toContain('Savings rate is 20%')
  })

  it('generates empty explanation for no savings', () => {
    const insight = aggregateSavingsRules({
      context: {
        diagnostics: {
          warnings: [],
        },
      },
      metrics: {
        savingsCount: 0,
      },
      ruleResults: [],
      scope: 'current_cutoff',
    })

    expect(insight.explanation).toBe('No savings are recorded for this scope yet.')
  })
})
