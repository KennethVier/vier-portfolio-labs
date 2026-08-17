import { INCOME_STABILITY, INCOME_TREND } from '../../models/incomeInsight.js'

export const UNSPECIFIED_INCOME_SOURCE = 'Unspecified Income'

function toAmount(value) {
  return Number(value) || 0
}

function roundCurrency(value) {
  return Math.round((Number(value) || 0) * 100) / 100
}

function roundPercent(value) {
  return Math.round((Number(value) || 0) * 100) / 100
}

function normalizeSource(value) {
  const source = String(value ?? '').trim()
  return source || UNSPECIFIED_INCOME_SOURCE
}

function sortByAmountThenName(firstItem, secondItem) {
  if (secondItem.amount === firstItem.amount) {
    return firstItem.source.localeCompare(secondItem.source)
  }

  return secondItem.amount - firstItem.amount
}

export function sumIncome(incomeRecords) {
  return roundCurrency(
    incomeRecords.reduce((total, income) => total + toAmount(income.amount), 0),
  )
}

export function calculateIncomeComparison(currentTotal, comparisonTotal) {
  const difference = roundCurrency(currentTotal - comparisonTotal)

  if (!comparisonTotal && !currentTotal) {
    return {
      direction: INCOME_TREND.noData,
      currentTotal: 0,
      comparisonTotal: 0,
      difference: 0,
      percentageChange: 0,
    }
  }

  if (!comparisonTotal && currentTotal > 0) {
    return {
      direction: INCOME_TREND.increasing,
      currentTotal: roundCurrency(currentTotal),
      comparisonTotal: 0,
      difference,
      percentageChange: 100,
    }
  }

  const percentageChange = roundPercent((difference / comparisonTotal) * 100)
  const absoluteChange = Math.abs(percentageChange)
  let direction = INCOME_TREND.stable

  if (absoluteChange >= 10) {
    direction =
      percentageChange > 0 ? INCOME_TREND.increasing : INCOME_TREND.decreasing
  }

  return {
    direction,
    currentTotal: roundCurrency(currentTotal),
    comparisonTotal: roundCurrency(comparisonTotal),
    difference,
    percentageChange,
  }
}

export function calculateSourceBreakdown(incomeRecords) {
  const totalIncome = sumIncome(incomeRecords)
  const sourceTotals = incomeRecords.reduce((totals, income) => {
    const source = normalizeSource(income.source)
    const current = totals.get(source) ?? {
      amount: 0,
      count: 0,
      source,
    }

    totals.set(source, {
      ...current,
      amount: current.amount + toAmount(income.amount),
      count: current.count + 1,
    })

    return totals
  }, new Map())

  return [...sourceTotals.values()]
    .map((source) => ({
      ...source,
      amount: roundCurrency(source.amount),
      percentage:
        totalIncome === 0 ? 0 : roundPercent((source.amount / totalIncome) * 100),
    }))
    .sort(sortByAmountThenName)
}

export function getPrimarySource(sourceBreakdown) {
  return sourceBreakdown[0] ?? null
}

export function calculateMonthlyComparison({
  currentMonth,
  currentRecords,
  previousMonth,
  previousRecords,
}) {
  const comparison = calculateIncomeComparison(
    sumIncome(currentRecords),
    sumIncome(previousRecords),
  )

  return {
    currentMonth,
    previousMonth,
    currentTotal: comparison.currentTotal,
    previousTotal: comparison.comparisonTotal,
    difference: comparison.difference,
    percentageChange: comparison.percentageChange,
    direction: comparison.direction,
  }
}

export function detectMissingIncome({ currentCutoff, totalIncome, incomeCount }) {
  const expectedIncome = roundCurrency(currentCutoff?.expectedIncome ?? 0)
  const gap = roundCurrency(Math.max(0, expectedIncome - totalIncome))

  if (!currentCutoff) {
    return {
      missing: false,
      expectedIncome: 0,
      actualIncome: totalIncome,
      gap: 0,
      reason: 'No current cutoff is available.',
    }
  }

  if (incomeCount === 0) {
    return {
      missing: true,
      expectedIncome,
      actualIncome: totalIncome,
      gap,
      reason: 'No income is recorded for the current cutoff.',
    }
  }

  return {
    missing: false,
    expectedIncome,
    actualIncome: totalIncome,
    gap,
    reason:
      gap > 0
        ? 'Current income is below expected income for this cutoff.'
        : 'Income is recorded for the current cutoff.',
  }
}

export function calculateIncomeStability({
  incomeCount,
  previousComparison,
  primarySource,
  sourceBreakdown,
}) {
  if (incomeCount === 0) {
    return {
      status: INCOME_STABILITY.noData,
      recordCount: 0,
      sourceCount: 0,
      primarySourceShare: 0,
      variancePercent: null,
    }
  }

  const sourceCount = sourceBreakdown.length
  const primarySourceShare = primarySource?.percentage ?? 0

  if (previousComparison.direction === INCOME_TREND.noData) {
    return {
      status: INCOME_STABILITY.insufficientHistory,
      recordCount: incomeCount,
      sourceCount,
      primarySourceShare,
      variancePercent: null,
    }
  }

  const variancePercent = Math.abs(previousComparison.percentageChange)
  let status = INCOME_STABILITY.stable

  if (variancePercent >= 25) {
    status = INCOME_STABILITY.unstable
  } else if (variancePercent >= 10) {
    status = INCOME_STABILITY.moderate
  }

  return {
    status,
    recordCount: incomeCount,
    sourceCount,
    primarySourceShare,
    variancePercent: roundPercent(variancePercent),
  }
}

export function buildIncomeMetrics(context) {
  const totalIncome = sumIncome(context.income.current)
  const incomeCount = context.income.current.length
  const sourceBreakdown = calculateSourceBreakdown(context.income.current)
  const primarySource = getPrimarySource(sourceBreakdown)
  const previousCutoffComparison =
    context.income.hasComparisonPeriod && context.income.comparison.length > 0
      ? calculateIncomeComparison(totalIncome, sumIncome(context.income.comparison))
      : {
          direction: INCOME_TREND.noData,
          currentTotal: totalIncome,
          comparisonTotal: 0,
          difference: 0,
          percentageChange: 0,
        }
  const monthlyComparison =
    context.income.hasMonthlyComparisonPeriod && context.income.previousMonth.length > 0
      ? calculateMonthlyComparison({
          currentMonth: context.period.currentMonth,
          currentRecords: context.income.currentMonth,
          previousMonth: context.period.previousMonth,
          previousRecords: context.income.previousMonth,
        })
      : {
          currentMonth: context.period.currentMonth,
          previousMonth: context.period.previousMonth,
          currentTotal: sumIncome(context.income.currentMonth),
          previousTotal: 0,
          difference: 0,
          percentageChange: 0,
          direction: INCOME_TREND.noData,
        }

  return {
    totalIncome,
    incomeCount,
    averageIncome: incomeCount ? roundCurrency(totalIncome / incomeCount) : 0,
    sourceBreakdown,
    primarySource,
    previousCutoffComparison,
    monthlyComparison,
    trend: previousCutoffComparison,
    missingIncome: detectMissingIncome({
      currentCutoff: context.currentCutoff,
      totalIncome,
      incomeCount,
    }),
    stability: calculateIncomeStability({
      incomeCount,
      previousComparison: previousCutoffComparison,
      primarySource,
      sourceBreakdown,
    }),
  }
}
