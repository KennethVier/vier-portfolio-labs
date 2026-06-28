import { describe, expect, it } from 'vitest'

import { EXPENSE_RULE_STATUS, createExpenseRuleResult } from '../../models/expenseRuleResult.js'
import { INSIGHT_SCOPES } from '../../utils/insightConstants.js'
import { INSIGHT_SEVERITY } from '../../utils/insightSeverity.js'
import { aggregateExpenseRules } from './expenseAggregator.js'

describe('expense aggregation', () => {
  it('aggregates rule results into ExpenseInsight evidence, diagnostics, and explanation', () => {
    const insight = aggregateExpenseRules({
      context: {
        diagnostics: {
          warnings: ['No previous cutoff'],
        },
      },
      metrics: {
        expenseCount: 2,
        topSpendingCategory: {
          categoryName: 'Food',
        },
        trend: {
          direction: 'Stable',
        },
        anomalies: [],
      },
      ruleResults: [
        createExpenseRuleResult({
          evidence: [
            {
              label: 'Total Expenses',
              value: 1000,
            },
          ],
          id: 'expense_exists',
          message: 'Expenses exist.',
          ruleName: 'Expense Exists',
          score: 100,
          severity: INSIGHT_SEVERITY.success,
          status: EXPENSE_RULE_STATUS.pass,
          weight: 5,
        }),
      ],
      scope: INSIGHT_SCOPES.currentCutoff,
    })

    expect(insight).toMatchObject({
      category: 'expense',
      scope: INSIGHT_SCOPES.currentCutoff,
      breakdown: [
        {
          id: 'expense_exists',
          label: 'Expense Exists',
          score: 100,
          status: EXPENSE_RULE_STATUS.pass,
          severity: INSIGHT_SEVERITY.success,
          weight: 5,
        },
      ],
      evidence: [
        {
          ruleId: 'expense_exists',
          label: 'Total Expenses',
          value: 1000,
        },
      ],
      diagnostics: {
        executedRules: ['expense_exists'],
        warnings: ['No previous cutoff'],
      },
    })
    expect(insight.explanation).toBe(
      'Food is the top spending category. Expense trend is stable versus the previous cutoff. No spending anomalies were detected.',
    )
  })
})
