import { describe, expect, it } from 'vitest'

import {
  CASHFLOW_POSITION,
  CASHFLOW_STABILITY,
  COVERAGE_STATUS,
  SPENDING_PACE_STATUS,
  createEmptyCashflowMetrics,
} from '../../models/cashflowInsight.js'
import { CASHFLOW_RULE_STATUS } from '../../models/cashflowRuleResult.js'
import { INSIGHT_SEVERITY } from '../../utils/insightSeverity.js'
import { CASHFLOW_RULE_IDS } from './cashflowRuleConstants.js'
import {
  evaluateCashflowStability,
  evaluateIncomeCoverage,
  evaluateNetCashflow,
  evaluateRemainingCash,
  evaluateSavingsCoverage,
  evaluateSpendingPace,
} from './cashflowRules.js'

const WEIGHT = 10

function createContext({ metrics = {}, currentCutoff = { id: 1 }, cashflow = { actualIncome: 1000 } } = {}) {
  return {
    cashflow,
    currentCutoff,
    metrics: { ...createEmptyCashflowMetrics(), ...metrics },
  }
}

describe('evaluateRemainingCash', () => {
  it('passes with success severity when remaining cash is positive', () => {
    const result = evaluateRemainingCash(
      createContext({ metrics: { remainingCash: 500 } }),
      WEIGHT,
    )

    expect(result.id).toBe(CASHFLOW_RULE_IDS.remainingCash)
    expect(result.status).toBe(CASHFLOW_RULE_STATUS.pass)
    expect(result.severity).toBe(INSIGHT_SEVERITY.success)
    expect(result.score).toBe(100)
    expect(result.passed).toBe(true)
    expect(result.weight).toBe(WEIGHT)
    expect(result.evidence).toEqual([{ label: 'Remaining Cash', value: 500 }])
  })

  it('treats zero as a warning that is distinct from negative remaining cash', () => {
    const zero = evaluateRemainingCash(
      createContext({ metrics: { remainingCash: 0 } }),
      WEIGHT,
    )
    const negative = evaluateRemainingCash(
      createContext({ metrics: { remainingCash: -1 } }),
      WEIGHT,
    )

    expect(zero.status).toBe(CASHFLOW_RULE_STATUS.warning)
    expect(zero.severity).toBe(INSIGHT_SEVERITY.warning)
    expect(zero.score).toBe(70)
    expect(zero.passed).toBe(true)
    expect(zero.evidence).toEqual([{ label: 'Remaining Cash', value: 0 }])

    expect(negative.status).toBe(CASHFLOW_RULE_STATUS.fail)
    expect(negative.severity).toBe(INSIGHT_SEVERITY.critical)
    expect(negative.score).toBe(0)
    expect(negative.passed).toBe(false)
    expect(negative.evidence).toEqual([{ label: 'Remaining Cash', value: -1 }])
    expect(zero.status).not.toBe(negative.status)
  })

  it('returns no-data/info without a current cutoff', () => {
    const result = evaluateRemainingCash(
      createContext({ currentCutoff: null }),
      WEIGHT,
    )

    expect(result.status).toBe(CASHFLOW_RULE_STATUS.noData)
    expect(result.severity).toBe(INSIGHT_SEVERITY.info)
  })
})

describe('evaluateNetCashflow', () => {
  it('passes for non-negative net cashflow, including zero', () => {
    for (const netCashflow of [2500, 0]) {
      const result = evaluateNetCashflow(
        createContext({
          metrics: { netCashflow, position: CASHFLOW_POSITION.positive },
        }),
        WEIGHT,
      )

      expect(result.id).toBe(CASHFLOW_RULE_IDS.netCashflow)
      expect(result.status).toBe(CASHFLOW_RULE_STATUS.pass)
      expect(result.severity).toBe(INSIGHT_SEVERITY.success)
      expect(result.score).toBe(100)
      expect(result.evidence).toEqual([
        { label: 'Net Cashflow Before Savings', value: netCashflow },
        { label: 'Cashflow Position', value: CASHFLOW_POSITION.positive },
      ])
    }
  })

  it('fails with critical severity for negative net cashflow', () => {
    const result = evaluateNetCashflow(
      createContext({
        metrics: { netCashflow: -100, position: CASHFLOW_POSITION.negative },
      }),
      WEIGHT,
    )

    expect(result.status).toBe(CASHFLOW_RULE_STATUS.fail)
    expect(result.severity).toBe(INSIGHT_SEVERITY.critical)
    expect(result.score).toBe(0)
    expect(result.value).toEqual({ amount: -100, position: CASHFLOW_POSITION.negative })
  })

  it('returns no-data/info without a current cutoff', () => {
    const result = evaluateNetCashflow(createContext({ currentCutoff: null }), WEIGHT)

    expect(result.status).toBe(CASHFLOW_RULE_STATUS.noData)
    expect(result.severity).toBe(INSIGHT_SEVERITY.info)
  })
})

describe('evaluateSpendingPace', () => {
  const pace = (status) => ({
    status,
    dailySpendingRate: 100,
    elapsedDays: 5,
    totalDays: 15,
    elapsedPercent: 33.33,
    spendingPercent: 50,
    paceDelta: 16.67,
  })

  it('warns on Fast pace', () => {
    const result = evaluateSpendingPace(
      createContext({ metrics: { spendingPace: pace(SPENDING_PACE_STATUS.fast) } }),
      WEIGHT,
    )

    expect(result.id).toBe(CASHFLOW_RULE_IDS.spendingPace)
    expect(result.status).toBe(CASHFLOW_RULE_STATUS.warning)
    expect(result.severity).toBe(INSIGHT_SEVERITY.warning)
    expect(result.score).toBe(55)
    expect(result.evidence.map((item) => item.label)).toEqual([
      'Daily Spending Rate',
      'Cutoff Elapsed',
      'Income Spent',
      'Pace Delta',
    ])
  })

  it('passes with info severity on On Pace', () => {
    const result = evaluateSpendingPace(
      createContext({ metrics: { spendingPace: pace(SPENDING_PACE_STATUS.onPace) } }),
      WEIGHT,
    )

    expect(result.status).toBe(CASHFLOW_RULE_STATUS.pass)
    expect(result.severity).toBe(INSIGHT_SEVERITY.info)
    expect(result.score).toBe(85)
  })

  it('passes with success severity on Slow pace', () => {
    const result = evaluateSpendingPace(
      createContext({ metrics: { spendingPace: pace(SPENDING_PACE_STATUS.slow) } }),
      WEIGHT,
    )

    expect(result.status).toBe(CASHFLOW_RULE_STATUS.pass)
    expect(result.severity).toBe(INSIGHT_SEVERITY.success)
    expect(result.score).toBe(100)
  })

  it('returns no-data/info with income evidence when pace is No Data', () => {
    const result = evaluateSpendingPace(
      createContext({
        cashflow: { actualIncome: 0 },
        metrics: { spendingPace: pace(SPENDING_PACE_STATUS.noData) },
      }),
      WEIGHT,
    )

    expect(result.status).toBe(CASHFLOW_RULE_STATUS.noData)
    expect(result.severity).toBe(INSIGHT_SEVERITY.info)
    expect(result.evidence).toEqual([
      expect.objectContaining({ label: 'Actual Income', value: 0 }),
    ])
  })
})

describe.each([
  {
    name: 'evaluateIncomeCoverage',
    evaluate: evaluateIncomeCoverage,
    key: 'incomeCoverage',
    id: CASHFLOW_RULE_IDS.incomeCoverage,
    base: { actualIncome: 1000, requiredOutflows: 800, coveragePercent: 125 },
    evidenceLabels: ['Actual Income', 'Recorded Outflows', 'Coverage'],
  },
  {
    name: 'evaluateSavingsCoverage',
    evaluate: evaluateSavingsCoverage,
    key: 'savingsCoverage',
    id: CASHFLOW_RULE_IDS.savingsCoverage,
    base: { availableAfterExpenses: 500, totalSavings: 400, coveragePercent: 125 },
    evidenceLabels: ['Available After Expenses', 'Savings', 'Savings Coverage'],
  },
])('$name', ({ evaluate, key, id, base, evidenceLabels }) => {
  const run = (status) =>
    evaluate(createContext({ metrics: { [key]: { ...base, status } } }), WEIGHT)

  it('Covered → pass / success / 100', () => {
    const result = run(COVERAGE_STATUS.covered)

    expect(result.id).toBe(id)
    expect(result.status).toBe(CASHFLOW_RULE_STATUS.pass)
    expect(result.severity).toBe(INSIGHT_SEVERITY.success)
    expect(result.score).toBe(100)
    expect(result.evidence.map((item) => item.label)).toEqual(evidenceLabels)
  })

  it('Partial → warning / warning / 60', () => {
    const result = run(COVERAGE_STATUS.partial)

    expect(result.status).toBe(CASHFLOW_RULE_STATUS.warning)
    expect(result.severity).toBe(INSIGHT_SEVERITY.warning)
    expect(result.score).toBe(60)
  })

  it('Uncovered → fail / critical / 0', () => {
    const result = run(COVERAGE_STATUS.uncovered)

    expect(result.status).toBe(CASHFLOW_RULE_STATUS.fail)
    expect(result.severity).toBe(INSIGHT_SEVERITY.critical)
    expect(result.score).toBe(0)
  })

  it('No Data → no-data / info', () => {
    const result = run(COVERAGE_STATUS.noData)

    expect(result.status).toBe(CASHFLOW_RULE_STATUS.noData)
    expect(result.severity).toBe(INSIGHT_SEVERITY.info)
  })
})

describe('evaluateCashflowStability', () => {
  const run = (status) =>
    evaluateCashflowStability(
      createContext({
        metrics: {
          incomeCoverage: {
            ...createEmptyCashflowMetrics().incomeCoverage,
            status: COVERAGE_STATUS.covered,
          },
          position: CASHFLOW_POSITION.positive,
          spendingPace: {
            ...createEmptyCashflowMetrics().spendingPace,
            status: SPENDING_PACE_STATUS.onPace,
          },
          stability: { status, reason: `reason for ${status}` },
        },
      }),
      WEIGHT,
    )

  it('Stable → pass / success / 100 with meaningful evidence', () => {
    const result = run(CASHFLOW_STABILITY.stable)

    expect(result.id).toBe(CASHFLOW_RULE_IDS.cashflowStability)
    expect(result.status).toBe(CASHFLOW_RULE_STATUS.pass)
    expect(result.severity).toBe(INSIGHT_SEVERITY.success)
    expect(result.score).toBe(100)
    expect(result.message).toBe('reason for Stable')
    expect(result.evidence).toEqual([
      { label: 'Cashflow Position', value: CASHFLOW_POSITION.positive },
      { label: 'Spending Pace', value: SPENDING_PACE_STATUS.onPace },
      { label: 'Income Coverage', value: COVERAGE_STATUS.covered },
    ])
  })

  it('Strained → warning / warning / 60', () => {
    const result = run(CASHFLOW_STABILITY.strained)

    expect(result.status).toBe(CASHFLOW_RULE_STATUS.warning)
    expect(result.severity).toBe(INSIGHT_SEVERITY.warning)
    expect(result.score).toBe(60)
  })

  it('Unstable → fail / critical / 0', () => {
    const result = run(CASHFLOW_STABILITY.unstable)

    expect(result.status).toBe(CASHFLOW_RULE_STATUS.fail)
    expect(result.severity).toBe(INSIGHT_SEVERITY.critical)
    expect(result.score).toBe(0)
  })

  it('No Data → no-data / info', () => {
    const result = run(CASHFLOW_STABILITY.noData)

    expect(result.status).toBe(CASHFLOW_RULE_STATUS.noData)
    expect(result.severity).toBe(INSIGHT_SEVERITY.info)
  })
})
