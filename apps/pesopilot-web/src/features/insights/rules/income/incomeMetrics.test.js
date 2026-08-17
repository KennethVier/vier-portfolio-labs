import { describe, expect, it } from 'vitest'

import { INCOME_STABILITY, INCOME_TREND } from '../../models/incomeInsight.js'
import {
  buildIncomeMetrics,
  calculateIncomeComparison,
  calculateIncomeStability,
  calculateMonthlyComparison,
  calculateSourceBreakdown,
  detectMissingIncome,
  getPrimarySource,
  sumIncome,
} from './incomeMetrics.js'

function createContext({ comparison = [], current = [], currentMonth = [], previousMonth = [] }) {
  return {
    currentCutoff: {
      id: 1,
      expectedIncome: 40000,
    },
    income: {
      current,
      comparison,
      currentMonth,
      previousMonth,
      hasComparisonPeriod: comparison.length > 0,
      hasMonthlyComparisonPeriod: previousMonth.length > 0,
    },
    period: {
      currentMonth: '2026-06',
      previousMonth: '2026-05',
    },
  }
}

describe('income metrics', () => {
  it('calculates total income and source aggregation', () => {
    const income = [
      { amount: 40000, source: 'Salary' },
      { amount: 10000, source: 'Freelance' },
      { amount: 5000, source: 'Freelance' },
    ]
    const breakdown = calculateSourceBreakdown(income)

    expect(sumIncome(income)).toBe(55000)
    expect(breakdown).toEqual([
      {
        amount: 40000,
        count: 1,
        percentage: 72.73,
        source: 'Salary',
      },
      {
        amount: 15000,
        count: 2,
        percentage: 27.27,
        source: 'Freelance',
      },
    ])
    expect(getPrimarySource(breakdown).source).toBe('Salary')
  })

  it('falls back for missing income source', () => {
    expect(calculateSourceBreakdown([{ amount: 500, source: '' }])).toEqual([
      {
        amount: 500,
        count: 1,
        percentage: 100,
        source: 'Unspecified Income',
      },
    ])
  })

  it('calculates comparison up, down, stable, and no-data', () => {
    expect(calculateIncomeComparison(1200, 1000)).toMatchObject({
      direction: INCOME_TREND.increasing,
      percentageChange: 20,
    })
    expect(calculateIncomeComparison(800, 1000)).toMatchObject({
      direction: INCOME_TREND.decreasing,
      percentageChange: -20,
    })
    expect(calculateIncomeComparison(1050, 1000)).toMatchObject({
      direction: INCOME_TREND.stable,
      percentageChange: 5,
    })
    expect(calculateIncomeComparison(0, 0)).toMatchObject({
      direction: INCOME_TREND.noData,
    })
  })

  it('calculates monthly comparison', () => {
    expect(
      calculateMonthlyComparison({
        currentMonth: '2026-06',
        currentRecords: [{ amount: 44000 }],
        previousMonth: '2026-05',
        previousRecords: [{ amount: 40000 }],
      }),
    ).toEqual({
      currentMonth: '2026-06',
      previousMonth: '2026-05',
      currentTotal: 44000,
      previousTotal: 40000,
      difference: 4000,
      percentageChange: 10,
      direction: INCOME_TREND.increasing,
    })
  })

  it('detects missing income and expected income gaps', () => {
    expect(
      detectMissingIncome({
        currentCutoff: { expectedIncome: 40000 },
        incomeCount: 0,
        totalIncome: 0,
      }),
    ).toMatchObject({
      missing: true,
      expectedIncome: 40000,
      gap: 40000,
    })
    expect(
      detectMissingIncome({
        currentCutoff: { expectedIncome: 40000 },
        incomeCount: 1,
        totalIncome: 30000,
      }),
    ).toMatchObject({
      missing: false,
      gap: 10000,
    })
  })

  it('calculates stability states', () => {
    expect(
      calculateIncomeStability({
        incomeCount: 1,
        previousComparison: { direction: INCOME_TREND.stable, percentageChange: 5 },
        primarySource: { percentage: 100 },
        sourceBreakdown: [{ source: 'Salary' }],
      }).status,
    ).toBe(INCOME_STABILITY.stable)
    expect(
      calculateIncomeStability({
        incomeCount: 1,
        previousComparison: {
          direction: INCOME_TREND.increasing,
          percentageChange: 12,
        },
        primarySource: { percentage: 100 },
        sourceBreakdown: [{ source: 'Salary' }],
      }).status,
    ).toBe(INCOME_STABILITY.moderate)
    expect(
      calculateIncomeStability({
        incomeCount: 1,
        previousComparison: {
          direction: INCOME_TREND.decreasing,
          percentageChange: -30,
        },
        primarySource: { percentage: 100 },
        sourceBreakdown: [{ source: 'Salary' }],
      }).status,
    ).toBe(INCOME_STABILITY.unstable)
    expect(
      calculateIncomeStability({
        incomeCount: 1,
        previousComparison: { direction: INCOME_TREND.noData },
        primarySource: { percentage: 100 },
        sourceBreakdown: [{ source: 'Salary' }],
      }).status,
    ).toBe(INCOME_STABILITY.insufficientHistory)
  })

  it('builds the complete metrics object', () => {
    const metrics = buildIncomeMetrics(
      createContext({
        current: [
          { amount: 40000, source: 'Salary' },
          { amount: 10000, source: 'Bonus' },
        ],
        comparison: [{ amount: 45000, source: 'Salary' }],
        currentMonth: [{ amount: 50000, source: 'Salary' }],
        previousMonth: [{ amount: 40000, source: 'Salary' }],
      }),
    )

    expect(metrics).toMatchObject({
      totalIncome: 50000,
      incomeCount: 2,
      averageIncome: 25000,
      primarySource: {
        source: 'Salary',
      },
      previousCutoffComparison: {
        direction: INCOME_TREND.increasing,
        percentageChange: 11.11,
      },
      monthlyComparison: {
        direction: INCOME_TREND.increasing,
        percentageChange: 25,
      },
      stability: {
        status: INCOME_STABILITY.moderate,
      },
    })
  })
})
