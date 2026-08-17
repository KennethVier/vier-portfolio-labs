import { describe, expect, it } from 'vitest'

import { INCOME_RULE_STATUS } from '../../models/incomeRuleResult.js'
import { INSIGHT_SEVERITY } from '../../utils/insightSeverity.js'
import { INCOME_RULE_IDS } from './incomeRuleConstants.js'
import { aggregateIncomeRules } from './incomeAggregator.js'

describe('income aggregator', () => {
  it('aggregates rule results into IncomeInsight evidence, breakdown, diagnostics, and explanation', () => {
    const insight = aggregateIncomeRules({
      context: {
        diagnostics: {
          warnings: ['No previous cutoff'],
        },
      },
      metrics: {
        incomeCount: 1,
        primarySource: {
          source: 'Salary',
        },
        trend: {
          direction: 'Increasing',
        },
        stability: {
          status: 'Stable',
        },
      },
      ruleResults: [
        {
          id: INCOME_RULE_IDS.totalIncome,
          ruleName: 'Total Income',
          score: 100,
          status: INCOME_RULE_STATUS.pass,
          severity: INSIGHT_SEVERITY.success,
          weight: 15,
          evidence: [
            {
              label: 'Total Income',
              value: 40000,
            },
          ],
        },
      ],
      scope: 'current_cutoff',
    })

    expect(insight).toMatchObject({
      category: 'income',
      scope: 'current_cutoff',
      breakdown: [
        {
          id: INCOME_RULE_IDS.totalIncome,
          label: 'Total Income',
          score: 100,
          status: INCOME_RULE_STATUS.pass,
          severity: INSIGHT_SEVERITY.success,
          weight: 15,
        },
      ],
      diagnostics: {
        executedRules: [INCOME_RULE_IDS.totalIncome],
        warnings: ['No previous cutoff'],
      },
      evidence: [
        {
          ruleId: INCOME_RULE_IDS.totalIncome,
          label: 'Total Income',
          value: 40000,
        },
      ],
    })
    expect(insight.explanation).toContain('Salary is the primary income source.')
  })

  it('generates empty explanation for no income', () => {
    const insight = aggregateIncomeRules({
      context: {
        diagnostics: {
          warnings: [],
        },
      },
      metrics: {
        incomeCount: 0,
      },
      ruleResults: [],
      scope: 'current_cutoff',
    })

    expect(insight.explanation).toBe('No income is recorded for this scope yet.')
  })
})
