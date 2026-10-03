import { describe, expect, it } from 'vitest'

import { CUTOFF_TREND } from '../../models/cutoffInsight.js'
import {
  aggregateMonthlyBuckets,
  buildComparison,
  buildCutoffMetrics,
  calculateMonthlyAverage,
} from './cutoffMetrics.js'

function snap(
  id,
  income,
  expenses,
  savings,
  remainingCash,
  { endDate, startDate, status } = {},
) {
  const month = String(id).padStart(2, '0')

  return {
    cutoffId: id,
    cutoffName: `C${id}`,
    endDate: endDate ?? `2026-${month}-28`,
    hasData:
      (Number(income) || 0) > 0 ||
      (Number(expenses) || 0) > 0 ||
      (Number(savings) || 0) > 0,
    income,
    expenses,
    remainingCash,
    savings,
    startDate: startDate ?? `2026-${month}-01`,
    status: status ?? 'closed',
  }
}

function ctx({ current, history = [], previous = null }) {
  return {
    current,
    currentCutoff: current ? { id: current.cutoffId, startDate: current.startDate, endDate: current.endDate } : null,
    history,
    previous,
  }
}

describe('buildComparison', () => {
  it('returns difference, percentage change and direction', () => {
    expect(buildComparison(120, 100)).toMatchObject({
      difference: 20,
      direction: CUTOFF_TREND.increasing,
      percentageChange: 20,
    })
    expect(buildComparison(80, 100).direction).toBe(CUTOFF_TREND.decreasing)
    expect(buildComparison(102, 100).direction).toBe(CUTOFF_TREND.stable)
  })

  it('handles a zero baseline without dividing by zero', () => {
    expect(buildComparison(50, 0)).toMatchObject({
      difference: 50,
      direction: CUTOFF_TREND.increasing,
      percentageChange: 0,
    })
  })

  it('returns No Data for non-finite input', () => {
    expect(buildComparison(NaN, 1).direction).toBe(CUTOFF_TREND.noData)
  })
})

describe('buildCutoffMetrics', () => {
  it('returns empty metrics without a current cutoff', () => {
    const metrics = buildCutoffMetrics(ctx({ current: null }))

    expect(metrics.currentCutoff).toBeNull()
    expect(metrics.trend.direction).toBe(CUTOFF_TREND.noData)
  })

  it('leaves previous comparison as No Data when previous is missing', () => {
    const metrics = buildCutoffMetrics(ctx({ current: snap(3, 100, 50, 10, 40) }))

    expect(metrics.previousCutoff).toBeNull()
    expect(metrics.previousCutoffComparison.income.direction).toBe(CUTOFF_TREND.noData)
  })

  it('aggregates two semi-monthly cutoffs into one historical calendar month and computes monthly average', () => {
    const h1 = snap(1, 20000, 10000, 2000, 8000, {
      startDate: '2026-01-01',
      endDate: '2026-01-15',
    })
    const h2 = snap(2, 30000, 15000, 3000, 12000, {
      startDate: '2026-01-16',
      endDate: '2026-01-31',
    })
    const current = snap(3, 25000, 12000, 2500, 10500, {
      startDate: '2026-02-01',
      endDate: '2026-02-15',
    })

    const metrics = buildCutoffMetrics(
      ctx({ current, history: [h2, h1], previous: h2 }),
    )

    expect(metrics.averageComparison.cutoffCount).toBe(2)
    expect(metrics.averageComparison.monthCount).toBe(1)
    expect(metrics.averageComparison.income).toMatchObject({
      comparisonTotal: 50000,
      currentTotal: 25000,
      difference: -25000,
      direction: CUTOFF_TREND.decreasing,
      percentageChange: -50,
    })
    expect(metrics.averageComparison.expenses).toMatchObject({
      comparisonTotal: 25000,
      difference: -13000,
    })
    expect(metrics.averageComparison.savings).toMatchObject({
      comparisonTotal: 5000,
      difference: -2500,
    })
    expect(metrics.averageComparison.remainingCash).toMatchObject({
      comparisonTotal: 20000,
      difference: -9500,
    })
  })

  it('computes historical monthly average across multiple completed months', () => {
    const jan1 = snap(1, 20000, 10000, 2000, 8000, {
      startDate: '2026-01-01',
      endDate: '2026-01-15',
    })
    const jan2 = snap(2, 30000, 15000, 3000, 12000, {
      startDate: '2026-01-16',
      endDate: '2026-01-31',
    })
    const feb = snap(3, 60000, 35000, 7000, 18000, {
      startDate: '2026-02-01',
      endDate: '2026-02-28',
    })
    const current = snap(4, 55000, 30000, 6000, 19000, {
      startDate: '2026-03-01',
      endDate: '2026-03-15',
    })

    const metrics = buildCutoffMetrics(
      ctx({ current, history: [feb, jan2, jan1], previous: feb }),
    )

    expect(metrics.averageComparison.cutoffCount).toBe(3)
    expect(metrics.averageComparison.monthCount).toBe(2)
    expect(metrics.averageComparison.income.comparisonTotal).toBe(55000)
    expect(metrics.averageComparison.expenses.comparisonTotal).toBe(30000)
    expect(metrics.averageComparison.savings.comparisonTotal).toBe(6000)
    expect(metrics.averageComparison.remainingCash.comparisonTotal).toBe(19000)
  })

  it('returns No Data for monthly average comparison when no completed historical month exists', () => {
    const march1 = snap(1, 20000, 10000, 2000, 8000, {
      startDate: '2026-03-01',
      endDate: '2026-03-15',
    })
    const current = snap(2, 25000, 12000, 2500, 10500, {
      startDate: '2026-03-16',
      endDate: '2026-03-31',
    })

    const metrics = buildCutoffMetrics(
      ctx({ current, history: [march1], previous: march1 }),
    )

    expect(metrics.averageComparison.monthCount).toBe(0)
    expect(metrics.averageComparison.cutoffCount).toBe(0)
    expect(metrics.averageComparison.income.direction).toBe(CUTOFF_TREND.noData)
    expect(metrics.averageComparison.remainingCash.direction).toBe(CUTOFF_TREND.noData)
  })

  it('excludes future and planned cutoffs from historical monthly aggregation', () => {
    const jan = snap(1, 50000, 25000, 5000, 20000, {
      startDate: '2026-01-01',
      endDate: '2026-01-31',
    })
    const planned = snap(2, 50000, 25000, 5000, 20000, {
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      status: 'planned',
    })
    const future = snap(3, 50000, 25000, 5000, 20000, {
      startDate: '2026-04-01',
      endDate: '2026-04-30',
    })
    const current = snap(4, 50000, 25000, 5000, 20000, {
      startDate: '2026-03-01',
      endDate: '2026-03-31',
    })

    const metrics = buildCutoffMetrics(
      ctx({ current, history: [future, planned, jan], previous: jan }),
    )

    expect(metrics.averageComparison.monthCount).toBe(1)
    expect(metrics.averageComparison.cutoffCount).toBe(1)
    expect(metrics.averageComparison.income.comparisonTotal).toBe(50000)
  })

  it('handles malformed and zero-data snapshots safely', () => {
    const malformed = {
      cutoffId: 99,
      hasData: true,
      income: 'not a number',
      startDate: '2026-01-01',
    }
    const zeroData = snap(1, 0, 0, 0, 0, {
      startDate: '2026-01-01',
      endDate: '2026-01-31',
    })
    const current = snap(2, 50000, 25000, 5000, 20000, {
      startDate: '2026-02-01',
      endDate: '2026-02-28',
    })

    const metrics = buildCutoffMetrics(
      ctx({ current, history: [malformed, zeroData] }),
    )

    expect(Number.isFinite(metrics.averageComparison.income.difference)).toBe(true)
  })

  it('has no best/worst with fewer than 2 snapshots', () => {
    const metrics = buildCutoffMetrics(ctx({ current: snap(3, 100, 50, 10, 40) }))

    expect(metrics.bestCutoff).toBeNull()
    expect(metrics.worstCutoff).toBeNull()
  })

  it('ranks best/worst by remaining cash with 2+ snapshots', () => {
    const h1 = snap(2, 200, 100, 20, 80)
    const metrics = buildCutoffMetrics(
      ctx({ current: snap(3, 100, 90, 0, 10), history: [h1], previous: h1 }),
    )

    expect(metrics.bestCutoff.cutoffId).toBe(2)
    expect(metrics.worstCutoff.cutoffId).toBe(3)
  })

  it('returns trend No Data with fewer than 3 snapshots', () => {
    const h1 = snap(2, 200, 100, 20, 80)
    const metrics = buildCutoffMetrics(
      ctx({ current: snap(3, 100, 90, 0, 10), history: [h1], previous: h1 }),
    )

    expect(metrics.previousCutoffComparison.remainingCash.direction).toBe(
      CUTOFF_TREND.decreasing,
    )
    expect(metrics.trend.direction).toBe(CUTOFF_TREND.noData)
  })

  it('returns a trend with current + 2 historical snapshots', () => {
    const h1 = snap(2, 200, 100, 20, 80)
    const h2 = snap(1, 200, 100, 20, 100)
    const metrics = buildCutoffMetrics(
      ctx({ current: snap(3, 100, 90, 0, 10), history: [h1, h2], previous: h1 }),
    )

    expect(metrics.trend).toMatchObject({
      basis: 'remainingCash',
      cutoffsCompared: 3,
      direction: CUTOFF_TREND.decreasing,
    })
  })
})

describe('aggregateMonthlyBuckets and calculateMonthlyAverage', () => {
  it('returns empty array when no valid snapshots are provided', () => {
    expect(aggregateMonthlyBuckets([])).toEqual([])
    expect(calculateMonthlyAverage([])).toBeNull()
  })
})
