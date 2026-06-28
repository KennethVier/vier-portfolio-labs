import { describe, expect, it, vi } from 'vitest'

import { HEALTH_STATUS } from '../../models/healthInsight.js'
import { HEALTH_RULE_STATUS } from '../../models/healthRuleResult.js'
import { INSIGHT_SCOPES } from '../../utils/insightConstants.js'
import { generateHealthInsight } from './healthEngine.js'

vi.mock('@/features/salary-cutoff/services/cutoffService.js', () => ({
  cutoffService: {
    findCurrentCutoff: vi.fn(async () => null),
  },
}))

vi.mock('@/features/income/services/incomeService.js', () => ({
  incomeService: {
    loadIncomeKpis: vi.fn(),
  },
}))

vi.mock('@/features/expenses/services/expenseService.js', () => ({
  expenseService: {
    loadExpenseKpis: vi.fn(),
  },
}))

vi.mock('@/features/savings/services/savingsService.js', () => ({
  savingsService: {
    loadSavings: vi.fn(),
    loadSavingsGoals: vi.fn(),
    loadSavingsKpis: vi.fn(),
  },
}))

describe('health engine', () => {
  it('returns Critical health with no-data rules when there is no current cutoff', async () => {
    const insight = await generateHealthInsight({
      scope: INSIGHT_SCOPES.currentCutoff,
    })

    expect(insight.category).toBe('health')
    expect(insight.scope).toBe(INSIGHT_SCOPES.currentCutoff)
    expect(insight.score).toBe(0)
    expect(insight.status).toBe(HEALTH_STATUS.critical)
    expect(insight.breakdown).toHaveLength(5)
    expect(insight.breakdown.every((rule) => rule.status === HEALTH_RULE_STATUS.noData)).toBe(true)
    expect(insight.evidence).toHaveLength(5)
    expect(insight.diagnostics.executedRules).toEqual([
      'income_availability',
      'expense_ratio',
      'savings_ratio',
      'remaining_cash',
      'goal_contribution_participation',
    ])
  })
})
