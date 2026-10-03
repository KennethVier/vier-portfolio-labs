import { describe, expect, it } from 'vitest'

import { createEmptyCutoffMetrics } from '../../models/cutoffInsight.js'
import { CUTOFF_RULE_STATUS } from '../../models/cutoffRuleResult.js'
import { buildCutoffMetrics } from './cutoffMetrics.js'
import {
  evaluateAverageComparison,
  evaluateCutoffTrend,
  evaluateExpenseComparison,
  evaluateIncomeComparison,
} from './cutoffRules.js'

function snap(id, income, expenses, remainingCash) {
  return {
    cutoffId: id,
    cutoffName: `C${id}`,
    endDate: `2026-0${id}-28`,
    income,
    expenses,
    savings: 0,
    remainingCash,
    hasData: true,
  }
}

describe('cutoff rules', () => {
  it('returns No Data on empty metrics', () => {
    const metrics = createEmptyCutoffMetrics()

    expect(evaluateIncomeComparison({ metrics }, 15).status).toBe(CUTOFF_RULE_STATUS.noData)
    expect(evaluateCutoffTrend({ metrics }, 15).status).toBe(CUTOFF_RULE_STATUS.noData)
  })

  it('warns when expenses increase and carries evidence', () => {
    const previous = snap(2, 100, 50, 50)
    const metrics = buildCutoffMetrics({
      currentCutoff: { id: 3 },
      current: snap(3, 100, 80, 20),
      previous,
      history: [previous],
    })
    const result = evaluateExpenseComparison({ metrics }, 15)

    expect(result.status).toBe(CUTOFF_RULE_STATUS.warning)
    expect(result.evidence.length).toBeGreaterThan(0)
  })

  it('produces deterministic output for identical input', () => {
    const previous = snap(2, 100, 50, 50)
    const context = {
      currentCutoff: { id: 3 },
      current: snap(3, 120, 50, 70),
      previous,
      history: [previous],
    }
    const first = evaluateIncomeComparison({ metrics: buildCutoffMetrics(context) }, 15)
    const second = evaluateIncomeComparison({ metrics: buildCutoffMetrics(context) }, 15)

    expect(first).toEqual(second)
    expect(first.message).toContain('increasing')
  })

  it('does not report a trend with insufficient history', () => {
    const previous = snap(2, 100, 50, 50)
    const metrics = buildCutoffMetrics({
      currentCutoff: { id: 3 },
      current: snap(3, 120, 50, 70),
      previous,
      history: [previous],
    })

    expect(evaluateCutoffTrend({ metrics }, 15).status).toBe(CUTOFF_RULE_STATUS.noData)
  })

  it('evaluates monthly average comparison and carries evidence', () => {
    const previous = snap(1, 100, 50, 50)
    const metrics = buildCutoffMetrics({
      currentCutoff: { id: 2, startDate: '2026-02-01', endDate: '2026-02-15' },
      current: {
        cutoffId: 2,
        cutoffName: 'C2',
        startDate: '2026-02-01',
        endDate: '2026-02-15',
        income: 120,
        expenses: 40,
        savings: 10,
        remainingCash: 70,
        hasData: true,
      },
      previous,
      history: [
        {
          cutoffId: 1,
          cutoffName: 'C1',
          startDate: '2026-01-01',
          endDate: '2026-01-31',
          income: 100,
          expenses: 50,
          savings: 10,
          remainingCash: 40,
          hasData: true,
        },
      ],
    })

    const result = evaluateAverageComparison({ metrics }, 15)

    expect(result.ruleName).toBe('Remaining Cash vs Monthly Average Comparison')
    expect(result.status).toBe(CUTOFF_RULE_STATUS.pass)
    expect(result.evidence.length).toBeGreaterThan(0)
  })
})

