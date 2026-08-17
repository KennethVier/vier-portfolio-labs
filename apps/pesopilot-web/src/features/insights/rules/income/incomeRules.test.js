import { describe, expect, it } from 'vitest'

import { INCOME_STABILITY, INCOME_TREND } from '../../models/incomeInsight.js'
import { INCOME_RULE_STATUS } from '../../models/incomeRuleResult.js'
import { INSIGHT_SEVERITY } from '../../utils/insightSeverity.js'
import { INCOME_RULE_IDS } from './incomeRuleConstants.js'
import {
  evaluateIncomeSourceBreakdown,
  evaluateIncomeStability,
  evaluateIncomeTrend,
  evaluateMissingIncomeDetection,
  evaluateMonthlyComparison,
  evaluatePreviousCutoffComparison,
  evaluateTotalIncome,
} from './incomeRules.js'

function createContext(overrides = {}) {
  return {
    currentCutoff: { id: 1, name: 'Current' },
    previousCutoff: { id: 2, name: 'Previous' },
    metrics: {
      totalIncome: 50000,
      incomeCount: 2,
      sourceBreakdown: [
        {
          amount: 40000,
          count: 1,
          percentage: 80,
          source: 'Salary',
        },
        {
          amount: 10000,
          count: 1,
          percentage: 20,
          source: 'Bonus',
        },
      ],
      previousCutoffComparison: {
        currentTotal: 50000,
        comparisonTotal: 45000,
        difference: 5000,
        percentageChange: 11.11,
        direction: INCOME_TREND.increasing,
      },
      monthlyComparison: {
        currentMonth: '2026-06',
        previousMonth: '2026-05',
        currentTotal: 50000,
        previousTotal: 45000,
        difference: 5000,
        percentageChange: 11.11,
        direction: INCOME_TREND.increasing,
      },
      trend: {
        currentTotal: 50000,
        comparisonTotal: 45000,
        difference: 5000,
        percentageChange: 11.11,
        direction: INCOME_TREND.increasing,
      },
      missingIncome: {
        missing: false,
        expectedIncome: 40000,
        actualIncome: 50000,
        gap: 0,
        reason: 'Income is recorded for the current cutoff.',
      },
      stability: {
        status: INCOME_STABILITY.moderate,
        recordCount: 2,
        sourceCount: 2,
        primarySourceShare: 80,
        variancePercent: 11.11,
      },
    },
    ...overrides,
  }
}

describe('income rules', () => {
  it('evaluates total income', () => {
    expect(evaluateTotalIncome(createContext(), 15)).toMatchObject({
      id: INCOME_RULE_IDS.totalIncome,
      status: INCOME_RULE_STATUS.pass,
      severity: INSIGHT_SEVERITY.success,
      value: 50000,
      evidence: expect.arrayContaining([
        {
          label: 'Total Income',
          value: 50000,
        },
      ]),
    })
  })

  it('handles no current cutoff as no-data', () => {
    expect(evaluateTotalIncome(createContext({ currentCutoff: null }), 15)).toMatchObject({
      status: INCOME_RULE_STATUS.noData,
      severity: INSIGHT_SEVERITY.info,
      passed: false,
    })
  })

  it('evaluates source breakdown', () => {
    expect(evaluateIncomeSourceBreakdown(createContext(), 12)).toMatchObject({
      id: INCOME_RULE_IDS.incomeSourceBreakdown,
      status: INCOME_RULE_STATUS.pass,
      value: expect.arrayContaining([
        expect.objectContaining({
          source: 'Salary',
        }),
      ]),
    })
  })

  it('evaluates previous cutoff comparison and trend', () => {
    expect(evaluatePreviousCutoffComparison(createContext(), 15)).toMatchObject({
      status: INCOME_RULE_STATUS.pass,
      value: expect.objectContaining({
        direction: INCOME_TREND.increasing,
      }),
    })
    expect(evaluateIncomeTrend(createContext(), 15)).toMatchObject({
      status: INCOME_RULE_STATUS.pass,
      severity: INSIGHT_SEVERITY.success,
    })
  })

  it('marks decreasing trend as warning', () => {
    const context = createContext({
      metrics: {
        ...createContext().metrics,
        trend: {
          currentTotal: 30000,
          comparisonTotal: 40000,
          difference: -10000,
          percentageChange: -25,
          direction: INCOME_TREND.decreasing,
        },
      },
    })

    expect(evaluateIncomeTrend(context, 15)).toMatchObject({
      status: INCOME_RULE_STATUS.warning,
      severity: INSIGHT_SEVERITY.warning,
      passed: false,
    })
  })

  it('evaluates monthly comparison', () => {
    expect(evaluateMonthlyComparison(createContext(), 12)).toMatchObject({
      id: INCOME_RULE_IDS.monthlyComparison,
      status: INCOME_RULE_STATUS.pass,
      evidence: expect.arrayContaining([
        expect.objectContaining({
          label: 'Current Month',
          value: '2026-06',
        }),
      ]),
    })
  })

  it('detects missing income as critical when expected income exists', () => {
    const context = createContext({
      metrics: {
        ...createContext().metrics,
        missingIncome: {
          missing: true,
          expectedIncome: 40000,
          actualIncome: 0,
          gap: 40000,
          reason: 'No income is recorded for the current cutoff.',
        },
      },
    })

    expect(evaluateMissingIncomeDetection(context, 18)).toMatchObject({
      status: INCOME_RULE_STATUS.warning,
      severity: INSIGHT_SEVERITY.critical,
      passed: false,
    })
  })

  it('evaluates stability states', () => {
    expect(evaluateIncomeStability(createContext(), 13)).toMatchObject({
      status: INCOME_RULE_STATUS.pass,
      severity: INSIGHT_SEVERITY.info,
    })

    const unstableContext = createContext({
      metrics: {
        ...createContext().metrics,
        stability: {
          status: INCOME_STABILITY.unstable,
          recordCount: 1,
          sourceCount: 1,
          primarySourceShare: 100,
          variancePercent: 30,
        },
      },
    })

    expect(evaluateIncomeStability(unstableContext, 13)).toMatchObject({
      status: INCOME_RULE_STATUS.warning,
      passed: false,
    })
  })

  it('does not mutate the normalized context', () => {
    const context = Object.freeze(createContext())

    expect(() => evaluateIncomeTrend(context, 15)).not.toThrow()
  })
})
