import { describe, expect, it } from 'vitest'

import {
  SAVINGS_CONSISTENCY,
  SAVINGS_RATE_STATUS,
  SAVINGS_TREND,
} from '../../models/savingsInsight.js'
import { SAVINGS_RULE_STATUS } from '../../models/savingsRuleResult.js'
import { INSIGHT_SEVERITY } from '../../utils/insightSeverity.js'
import { SAVINGS_RULE_IDS } from './savingsRuleConstants.js'
import {
  evaluateContributionFrequency,
  evaluateLargestSavingsContribution,
  evaluatePreviousCutoffComparison,
  evaluateSavingsConsistency,
  evaluateSavingsRate,
  evaluateSavingsTotal,
  evaluateSavingsTrend,
} from './savingsRules.js'

function createContext(overrides = {}) {
  return {
    currentCutoff: { id: 1, name: 'Current' },
    previousCutoff: { id: 2, name: 'Previous' },
    metrics: {
      totalSavings: 8000,
      savingsCount: 2,
      savingsRate: {
        rate: 20,
        totalIncome: 40000,
        totalSavings: 8000,
        status: SAVINGS_RATE_STATUS.strong,
      },
      trend: {
        currentTotal: 8000,
        comparisonTotal: 6000,
        difference: 2000,
        percentageChange: 33.33,
        direction: SAVINGS_TREND.increasing,
      },
      previousCutoffComparison: {
        currentTotal: 8000,
        comparisonTotal: 6000,
        difference: 2000,
        percentageChange: 33.33,
        direction: SAVINGS_TREND.increasing,
      },
      contributionFrequency: {
        contributionCount: 2,
        currentPeriodDays: 30,
        activeContributionDays: 2,
        contributionsPerWeek: 0.47,
      },
      largestSavingsContribution: {
        amount: 5000,
        date: '2026-06-05',
        id: 1,
        source: 'Emergency Fund',
      },
      consistency: {
        status: SAVINGS_CONSISTENCY.inconsistent,
        contributionCount: 2,
        contributionDays: 2,
        variancePercent: 33.33,
      },
    },
    ...overrides,
  }
}

describe('savings rules', () => {
  it('evaluates savings total', () => {
    expect(evaluateSavingsTotal(createContext(), 15)).toMatchObject({
      id: SAVINGS_RULE_IDS.savingsTotal,
      status: SAVINGS_RULE_STATUS.pass,
      severity: INSIGHT_SEVERITY.success,
      value: 8000,
      evidence: expect.arrayContaining([
        {
          label: 'Total Savings',
          value: 8000,
        },
      ]),
    })
  })

  it('handles no current cutoff as no-data', () => {
    expect(
      evaluateSavingsTotal(createContext({ currentCutoff: null }), 15),
    ).toMatchObject({
      status: SAVINGS_RULE_STATUS.noData,
      severity: INSIGHT_SEVERITY.info,
      passed: false,
    })
  })

  it('evaluates savings rate and marks low rates as warnings', () => {
    expect(evaluateSavingsRate(createContext(), 20)).toMatchObject({
      id: SAVINGS_RULE_IDS.savingsRate,
      status: SAVINGS_RULE_STATUS.pass,
      value: expect.objectContaining({
        rate: 20,
      }),
    })

    const lowRateContext = createContext({
      metrics: {
        ...createContext().metrics,
        savingsRate: {
          rate: 5,
          totalIncome: 40000,
          totalSavings: 2000,
          status: SAVINGS_RATE_STATUS.low,
        },
      },
    })

    expect(evaluateSavingsRate(lowRateContext, 20)).toMatchObject({
      status: SAVINGS_RULE_STATUS.warning,
      severity: INSIGHT_SEVERITY.warning,
      passed: false,
    })
  })

  it('evaluates trend and previous cutoff comparison', () => {
    expect(evaluateSavingsTrend(createContext(), 15)).toMatchObject({
      status: SAVINGS_RULE_STATUS.pass,
      value: expect.objectContaining({
        direction: SAVINGS_TREND.increasing,
      }),
    })
    expect(evaluatePreviousCutoffComparison(createContext(), 15)).toMatchObject({
      status: SAVINGS_RULE_STATUS.pass,
      severity: INSIGHT_SEVERITY.success,
    })
  })

  it('marks decreasing trend as warning', () => {
    const context = createContext({
      metrics: {
        ...createContext().metrics,
        trend: {
          currentTotal: 4000,
          comparisonTotal: 8000,
          difference: -4000,
          percentageChange: -50,
          direction: SAVINGS_TREND.decreasing,
        },
      },
    })

    expect(evaluateSavingsTrend(context, 15)).toMatchObject({
      status: SAVINGS_RULE_STATUS.warning,
      severity: INSIGHT_SEVERITY.warning,
      passed: false,
    })
  })

  it('evaluates contribution frequency and largest contribution', () => {
    expect(evaluateContributionFrequency(createContext(), 12)).toMatchObject({
      id: SAVINGS_RULE_IDS.contributionFrequency,
      status: SAVINGS_RULE_STATUS.pass,
      value: expect.objectContaining({
        contributionsPerWeek: 0.47,
      }),
    })
    expect(evaluateLargestSavingsContribution(createContext(), 10)).toMatchObject({
      id: SAVINGS_RULE_IDS.largestSavingsContribution,
      status: SAVINGS_RULE_STATUS.pass,
      value: expect.objectContaining({
        amount: 5000,
      }),
    })
  })

  it('evaluates consistency states', () => {
    expect(evaluateSavingsConsistency(createContext(), 13)).toMatchObject({
      status: SAVINGS_RULE_STATUS.warning,
      severity: INSIGHT_SEVERITY.warning,
      passed: false,
    })

    const stableContext = createContext({
      metrics: {
        ...createContext().metrics,
        consistency: {
          status: SAVINGS_CONSISTENCY.stable,
          contributionCount: 2,
          contributionDays: 2,
          variancePercent: 5,
        },
      },
    })

    expect(evaluateSavingsConsistency(stableContext, 13)).toMatchObject({
      status: SAVINGS_RULE_STATUS.pass,
      severity: INSIGHT_SEVERITY.success,
    })
  })

  it('does not mutate the normalized context', () => {
    const context = Object.freeze(createContext())

    expect(() => evaluateSavingsTrend(context, 15)).not.toThrow()
  })
})
