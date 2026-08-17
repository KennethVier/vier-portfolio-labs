import { describe, expect, it } from 'vitest'

import {
  SAVINGS_CONSISTENCY,
  SAVINGS_RATE_STATUS,
  SAVINGS_TREND,
} from '../../models/savingsInsight.js'
import {
  buildSavingsMetrics,
  calculateContributionFrequency,
  calculateSavingsComparison,
  calculateSavingsConsistency,
  calculateSavingsRate,
  getLargestSavingsContribution,
  sumSavings,
} from './savingsMetrics.js'

function createContext({ comparison = [], current = [], income = [] }) {
  return {
    currentCutoff: {
      endDate: '2026-06-30',
      id: 1,
      startDate: '2026-06-01',
    },
    savings: {
      current,
      comparison,
      hasComparisonPeriod: comparison.length > 0,
    },
    income: {
      current: income,
    },
  }
}

describe('savings metrics', () => {
  it('calculates savings total and treats invalid amounts as zero', () => {
    expect(sumSavings([{ amount: 1000 }, { amount: '250.5' }, { amount: null }])).toBe(
      1250.5,
    )
  })

  it('calculates savings rate from savings divided by income', () => {
    expect(
      calculateSavingsRate({
        totalIncome: 40000,
        totalSavings: 8000,
      }),
    ).toEqual({
      rate: 20,
      totalIncome: 40000,
      totalSavings: 8000,
      status: SAVINGS_RATE_STATUS.strong,
    })
    expect(
      calculateSavingsRate({
        totalIncome: 0,
        totalSavings: 1000,
      }).status,
    ).toBe(SAVINGS_RATE_STATUS.noData)
  })

  it('calculates trend up, down, stable, and no-data', () => {
    expect(calculateSavingsComparison(1200, 1000)).toMatchObject({
      direction: SAVINGS_TREND.increasing,
      percentageChange: 20,
    })
    expect(calculateSavingsComparison(800, 1000)).toMatchObject({
      direction: SAVINGS_TREND.decreasing,
      percentageChange: -20,
    })
    expect(calculateSavingsComparison(1050, 1000)).toMatchObject({
      direction: SAVINGS_TREND.stable,
      percentageChange: 5,
    })
    expect(calculateSavingsComparison(0, 0)).toMatchObject({
      direction: SAVINGS_TREND.noData,
    })
  })

  it('calculates contribution frequency per week from current cutoff days', () => {
    expect(
      calculateContributionFrequency({
        currentCutoff: {
          startDate: '2026-06-01',
          endDate: '2026-06-14',
        },
        savingsRecords: [
          { date: '2026-06-01' },
          { date: '2026-06-08' },
          { date: '2026-06-08' },
        ],
      }),
    ).toEqual({
      contributionCount: 3,
      currentPeriodDays: 14,
      activeContributionDays: 2,
      contributionsPerWeek: 1.5,
    })
  })

  it('finds the largest savings contribution with deterministic tie-breaking', () => {
    expect(
      getLargestSavingsContribution([
        {
          amount: 2000,
          date: '2026-06-01',
          id: 1,
          source: 'Emergency Fund',
        },
        {
          amount: 2000,
          date: '2026-06-03',
          goalId: 10,
          goalName: 'TERRA',
          id: 2,
          source: '',
        },
      ]),
    ).toEqual({
      id: 2,
      amount: 2000,
      source: 'General Savings',
      date: '2026-06-03',
      goalId: 10,
      goalName: 'TERRA',
    })
  })

  it('calculates savings consistency states', () => {
    expect(
      calculateSavingsConsistency({
        savingsCount: 0,
        previousComparison: { direction: SAVINGS_TREND.noData },
      }).status,
    ).toBe(SAVINGS_CONSISTENCY.noData)
    expect(
      calculateSavingsConsistency({
        savingsCount: 1,
        previousComparison: { direction: SAVINGS_TREND.noData },
      }).status,
    ).toBe(SAVINGS_CONSISTENCY.insufficientHistory)
    expect(
      calculateSavingsConsistency({
        savingsCount: 1,
        previousComparison: {
          direction: SAVINGS_TREND.increasing,
          percentageChange: 12,
        },
      }).status,
    ).toBe(SAVINGS_CONSISTENCY.moderate)
    expect(
      calculateSavingsConsistency({
        savingsCount: 1,
        previousComparison: {
          direction: SAVINGS_TREND.decreasing,
          percentageChange: -30,
        },
      }).status,
    ).toBe(SAVINGS_CONSISTENCY.inconsistent)
  })

  it('builds the complete metrics object from current cutoff records', () => {
    const metrics = buildSavingsMetrics(
      createContext({
        current: [
          { amount: 5000, date: '2026-06-05', id: 1, source: 'Emergency Fund' },
          { amount: 3000, date: '2026-06-20', id: 2, source: 'Travel Fund' },
        ],
        comparison: [{ amount: 6000, date: '2026-05-20', id: 3 }],
        income: [{ amount: 40000 }],
      }),
    )

    expect(metrics).toMatchObject({
      totalSavings: 8000,
      savingsCount: 2,
      averageContribution: 4000,
      savingsRate: {
        rate: 20,
        status: SAVINGS_RATE_STATUS.strong,
      },
      previousCutoffComparison: {
        direction: SAVINGS_TREND.increasing,
        percentageChange: 33.33,
      },
      contributionFrequency: {
        contributionCount: 2,
        currentPeriodDays: 30,
        activeContributionDays: 2,
        contributionsPerWeek: 0.47,
      },
      largestSavingsContribution: {
        amount: 5000,
      },
      consistency: {
        status: SAVINGS_CONSISTENCY.inconsistent,
        contributionDays: 2,
      },
    })
  })
})
