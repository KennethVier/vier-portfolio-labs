import { describe, expect, it } from 'vitest'

import {
  CASHFLOW_POSITION,
  CASHFLOW_STABILITY,
  COVERAGE_STATUS,
  SPENDING_PACE_STATUS,
  createEmptyCashflowMetrics,
} from '../../models/cashflowInsight.js'
import { buildCashflowMetrics, cashflowMetricsInternals } from './cashflowMetrics.js'

const {
  buildIncomeCoverage,
  buildSavingsCoverage,
  buildSpendingPace,
  buildStability,
  getPosition,
} = cashflowMetricsInternals

const empty = createEmptyCashflowMetrics()

// 10-day cutoff; today 2026-10-05 → elapsed day 5 of 10 → 50% elapsed.
const cutoff = { id: 1, startDate: '2026-10-01', endDate: '2026-10-10' }
const today = new Date('2026-10-05T12:00:00.000Z')

function pace({ actualIncome = 1000, totalExpenses = 500, currentCutoff = cutoff, now = today } = {}) {
  return buildSpendingPace({ actualIncome, currentCutoff, today: now, totalExpenses })
}

describe('buildSpendingPace', () => {
  it('computes days, rate, percentages and delta', () => {
    expect(pace({ totalExpenses: 500 })).toEqual({
      status: SPENDING_PACE_STATUS.onPace,
      dailySpendingRate: 100,
      elapsedDays: 5,
      totalDays: 10,
      elapsedPercent: 50,
      spendingPercent: 50,
      paceDelta: 0,
    })
  })

  it('stays On Pace at exactly +10 and -10 delta', () => {
    expect(pace({ totalExpenses: 600 })).toMatchObject({
      paceDelta: 10,
      status: SPENDING_PACE_STATUS.onPace,
    })
    expect(pace({ totalExpenses: 400 })).toMatchObject({
      paceDelta: -10,
      status: SPENDING_PACE_STATUS.onPace,
    })
  })

  it('is Fast above +10 and Slow below -10', () => {
    expect(pace({ totalExpenses: 601 })).toMatchObject({
      paceDelta: 10.1,
      status: SPENDING_PACE_STATUS.fast,
    })
    expect(pace({ totalExpenses: 399 })).toMatchObject({
      paceDelta: -10.1,
      status: SPENDING_PACE_STATUS.slow,
    })
  })

  it('clamps elapsed days to 1 before cutoff start', () => {
    expect(pace({ now: new Date('2026-09-20T00:00:00.000Z') })).toMatchObject({
      elapsedDays: 1,
      elapsedPercent: 10,
    })
  })

  it('clamps elapsed days to total days after cutoff end', () => {
    expect(pace({ now: new Date('2026-10-30T00:00:00.000Z') })).toMatchObject({
      elapsedDays: 10,
      elapsedPercent: 100,
      totalDays: 10,
    })
  })

  it('returns the empty pace for invalid dates, missing cutoff, or income <= 0', () => {
    expect(pace({ currentCutoff: { startDate: 'not-a-date', endDate: '2026-10-10' } })).toEqual(
      empty.spendingPace,
    )
    expect(pace({ currentCutoff: { startDate: '2026-10-10', endDate: '2026-10-01' } })).toEqual(
      empty.spendingPace,
    )
    expect(pace({ now: null })).toEqual(empty.spendingPace)
    expect(pace({ currentCutoff: null })).toEqual(empty.spendingPace)
    expect(pace({ actualIncome: 0 })).toEqual(empty.spendingPace)
    expect(pace({ actualIncome: -50 })).toEqual(empty.spendingPace)
  })
})

describe('buildIncomeCoverage', () => {
  it('is 100% Covered when income exists and there are no outflows', () => {
    expect(
      buildIncomeCoverage({ actualIncome: 1000, totalExpenses: 0, totalSavings: 0 }),
    ).toMatchObject({ coveragePercent: 100, requiredOutflows: 0, status: COVERAGE_STATUS.covered })
  })

  it('is Covered at >= 100%', () => {
    expect(
      buildIncomeCoverage({ actualIncome: 1000, totalExpenses: 600, totalSavings: 400 }),
    ).toMatchObject({ coveragePercent: 100, status: COVERAGE_STATUS.covered })
    expect(
      buildIncomeCoverage({ actualIncome: 1000, totalExpenses: 400, totalSavings: 0 }),
    ).toMatchObject({ coveragePercent: 250, status: COVERAGE_STATUS.covered })
  })

  it('is Partial with income below outflows', () => {
    expect(
      buildIncomeCoverage({ actualIncome: 500, totalExpenses: 800, totalSavings: 200 }),
    ).toMatchObject({ coveragePercent: 50, status: COVERAGE_STATUS.partial })
  })

  it('is Uncovered with outflows but no usable income', () => {
    expect(
      buildIncomeCoverage({ actualIncome: 0, totalExpenses: 100, totalSavings: 0 }),
    ).toMatchObject({ coveragePercent: 0, status: COVERAGE_STATUS.uncovered })
  })

  it('is No Data with no income and no outflows', () => {
    expect(
      buildIncomeCoverage({ actualIncome: 0, totalExpenses: 0, totalSavings: 0 }),
    ).toEqual(empty.incomeCoverage)
  })
})

describe('buildSavingsCoverage', () => {
  it('is No Data when savings <= 0', () => {
    expect(
      buildSavingsCoverage({ actualIncome: 1000, totalExpenses: 100, totalSavings: 0 }),
    ).toEqual(empty.savingsCoverage)
    expect(
      buildSavingsCoverage({ actualIncome: 1000, totalExpenses: 100, totalSavings: -5 }),
    ).toEqual(empty.savingsCoverage)
  })

  it('is Covered when available after expenses >= savings', () => {
    expect(
      buildSavingsCoverage({ actualIncome: 1000, totalExpenses: 600, totalSavings: 400 }),
    ).toMatchObject({
      availableAfterExpenses: 400,
      coveragePercent: 100,
      status: COVERAGE_STATUS.covered,
    })
  })

  it('is Partial for positive partial coverage', () => {
    expect(
      buildSavingsCoverage({ actualIncome: 1000, totalExpenses: 600, totalSavings: 800 }),
    ).toMatchObject({ coveragePercent: 50, status: COVERAGE_STATUS.partial })
  })

  it('is Uncovered when available after expenses <= 0', () => {
    expect(
      buildSavingsCoverage({ actualIncome: 1000, totalExpenses: 1000, totalSavings: 100 }),
    ).toMatchObject({ coveragePercent: 0, status: COVERAGE_STATUS.uncovered })
    expect(
      buildSavingsCoverage({ actualIncome: 500, totalExpenses: 600, totalSavings: 100 }),
    ).toMatchObject({ availableAfterExpenses: -100, status: COVERAGE_STATUS.uncovered })
  })
})

describe('getPosition', () => {
  it('maps remaining cash sign to position', () => {
    expect(getPosition(1)).toBe(CASHFLOW_POSITION.positive)
    expect(getPosition(0)).toBe(CASHFLOW_POSITION.balanced)
    expect(getPosition(-1)).toBe(CASHFLOW_POSITION.negative)
  })
})

describe('buildStability', () => {
  const stability = ({
    coverage = COVERAGE_STATUS.covered,
    position = CASHFLOW_POSITION.positive,
    paceStatus = SPENDING_PACE_STATUS.onPace,
  } = {}) =>
    buildStability({
      incomeCoverage: { status: coverage },
      position,
      spendingPace: { status: paceStatus },
    }).status

  it('is No Data when position or income coverage is No Data', () => {
    expect(stability({ position: CASHFLOW_POSITION.noData })).toBe(CASHFLOW_STABILITY.noData)
    expect(stability({ coverage: COVERAGE_STATUS.noData })).toBe(CASHFLOW_STABILITY.noData)
  })

  it('is Unstable for negative position or uncovered income', () => {
    expect(stability({ position: CASHFLOW_POSITION.negative })).toBe(CASHFLOW_STABILITY.unstable)
    expect(stability({ coverage: COVERAGE_STATUS.uncovered })).toBe(CASHFLOW_STABILITY.unstable)
  })

  it('is Strained for partial coverage or fast pace', () => {
    expect(stability({ coverage: COVERAGE_STATUS.partial })).toBe(CASHFLOW_STABILITY.strained)
    expect(stability({ paceStatus: SPENDING_PACE_STATUS.fast })).toBe(CASHFLOW_STABILITY.strained)
  })

  it('is Stable otherwise, including balanced position', () => {
    expect(stability()).toBe(CASHFLOW_STABILITY.stable)
    expect(stability({ position: CASHFLOW_POSITION.balanced })).toBe(CASHFLOW_STABILITY.stable)
    expect(stability({ paceStatus: SPENDING_PACE_STATUS.slow })).toBe(CASHFLOW_STABILITY.stable)
  })
})

describe('buildCashflowMetrics', () => {
  it('composes the full metrics contract', () => {
    const metrics = buildCashflowMetrics({
      cashflow: { actualIncome: 1000, remainingCash: 500, totalExpenses: 400, totalSavings: 100 },
      currentCutoff: cutoff,
      today,
    })

    expect(metrics).toMatchObject({
      remainingCash: 500,
      netCashflow: 600,
      position: CASHFLOW_POSITION.positive,
      spendingPace: { status: SPENDING_PACE_STATUS.onPace, paceDelta: -10 },
      incomeCoverage: { status: COVERAGE_STATUS.covered, coveragePercent: 200 },
      savingsCoverage: { status: COVERAGE_STATUS.covered, coveragePercent: 600 },
      stability: { status: CASHFLOW_STABILITY.stable },
    })
    expect(Object.keys(metrics)).toEqual(Object.keys(empty))
  })

  it('returns the canonical empty metrics without a cutoff or cashflow', () => {
    expect(buildCashflowMetrics({ cashflow: { actualIncome: 1 }, currentCutoff: null, today })).toEqual(empty)
    expect(buildCashflowMetrics({ cashflow: null, currentCutoff: cutoff, today })).toEqual(empty)
  })
})
