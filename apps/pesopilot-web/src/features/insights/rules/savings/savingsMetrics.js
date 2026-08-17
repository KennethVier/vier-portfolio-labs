import {
  SAVINGS_CONSISTENCY,
  SAVINGS_RATE_STATUS,
  SAVINGS_TREND,
} from '../../models/savingsInsight.js'

export const GENERAL_SAVINGS_SOURCE = 'General Savings'

function toAmount(value) {
  return Number(value) || 0
}

function roundCurrency(value) {
  return Math.round((Number(value) || 0) * 100) / 100
}

function roundPercent(value) {
  return Math.round((Number(value) || 0) * 100) / 100
}

function parseIsoDate(value) {
  if (!value) {
    return null
  }

  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isNaN(date.getTime()) ? null : date
}

function normalizeSource(value) {
  const source = String(value ?? '').trim()
  return source || GENERAL_SAVINGS_SOURCE
}

function getInclusiveDays(startDate, endDate) {
  const start = parseIsoDate(startDate)
  const end = parseIsoDate(endDate)

  if (!start || !end || end < start) {
    return 0
  }

  return Math.floor((end - start) / 86400000) + 1
}

export function sumSavings(savingsRecords) {
  return roundCurrency(
    savingsRecords.reduce((total, savings) => total + toAmount(savings.amount), 0),
  )
}

export function sumIncome(incomeRecords) {
  return roundCurrency(
    incomeRecords.reduce((total, income) => total + toAmount(income.amount), 0),
  )
}

export function calculateSavingsComparison(currentTotal, comparisonTotal) {
  const difference = roundCurrency(currentTotal - comparisonTotal)

  if (!comparisonTotal && !currentTotal) {
    return {
      direction: SAVINGS_TREND.noData,
      currentTotal: 0,
      comparisonTotal: 0,
      difference: 0,
      percentageChange: 0,
    }
  }

  if (!comparisonTotal && currentTotal > 0) {
    return {
      direction: SAVINGS_TREND.increasing,
      currentTotal: roundCurrency(currentTotal),
      comparisonTotal: 0,
      difference,
      percentageChange: 100,
    }
  }

  const percentageChange = roundPercent((difference / comparisonTotal) * 100)
  const absoluteChange = Math.abs(percentageChange)
  let direction = SAVINGS_TREND.stable

  if (absoluteChange >= 10) {
    direction =
      percentageChange > 0 ? SAVINGS_TREND.increasing : SAVINGS_TREND.decreasing
  }

  return {
    direction,
    currentTotal: roundCurrency(currentTotal),
    comparisonTotal: roundCurrency(comparisonTotal),
    difference,
    percentageChange,
  }
}

export function calculateSavingsRate({ totalIncome, totalSavings }) {
  if (totalIncome <= 0) {
    return {
      rate: 0,
      totalIncome: roundCurrency(totalIncome),
      totalSavings: roundCurrency(totalSavings),
      status: SAVINGS_RATE_STATUS.noData,
    }
  }

  const rate = roundPercent((totalSavings / totalIncome) * 100)
  let status = SAVINGS_RATE_STATUS.low

  if (rate >= 20) {
    status = SAVINGS_RATE_STATUS.strong
  } else if (rate >= 10) {
    status = SAVINGS_RATE_STATUS.acceptable
  }

  return {
    rate,
    totalIncome: roundCurrency(totalIncome),
    totalSavings: roundCurrency(totalSavings),
    status,
  }
}

export function calculateContributionFrequency({ currentCutoff, savingsRecords }) {
  const currentPeriodDays = getInclusiveDays(
    currentCutoff?.startDate,
    currentCutoff?.endDate,
  )
  const contributionCount = savingsRecords.length
  const activeContributionDays = new Set(
    savingsRecords.map((savings) => savings.date).filter(Boolean),
  ).size

  return {
    contributionCount,
    currentPeriodDays,
    activeContributionDays,
    contributionsPerWeek:
      currentPeriodDays > 0
        ? roundPercent(contributionCount / (currentPeriodDays / 7))
        : 0,
  }
}

export function getLargestSavingsContribution(savingsRecords) {
  return [...savingsRecords]
    .sort((firstSavings, secondSavings) => {
      const amountCompare = toAmount(secondSavings.amount) - toAmount(firstSavings.amount)

      if (amountCompare !== 0) {
        return amountCompare
      }

      const dateCompare = String(secondSavings.date ?? '').localeCompare(
        String(firstSavings.date ?? ''),
      )

      if (dateCompare !== 0) {
        return dateCompare
      }

      return (secondSavings.id ?? 0) - (firstSavings.id ?? 0)
    })
    .map((savings) => ({
      id: savings.id ?? null,
      amount: roundCurrency(savings.amount),
      source: normalizeSource(savings.source),
      date: savings.date ?? null,
      goalId: savings.goalId ?? null,
      goalName: savings.goalName ?? null,
    }))[0] ?? null
}

export function calculateSavingsConsistency({ savingsCount, previousComparison }) {
  if (savingsCount === 0) {
    return {
      status: SAVINGS_CONSISTENCY.noData,
      contributionCount: 0,
      contributionDays: 0,
      variancePercent: null,
    }
  }

  if (previousComparison.direction === SAVINGS_TREND.noData) {
    return {
      status: SAVINGS_CONSISTENCY.insufficientHistory,
      contributionCount: savingsCount,
      contributionDays: 0,
      variancePercent: null,
    }
  }

  const variancePercent = Math.abs(previousComparison.percentageChange)
  let status = SAVINGS_CONSISTENCY.stable

  if (variancePercent >= 25) {
    status = SAVINGS_CONSISTENCY.inconsistent
  } else if (variancePercent >= 10) {
    status = SAVINGS_CONSISTENCY.moderate
  }

  return {
    status,
    contributionCount: savingsCount,
    contributionDays: 0,
    variancePercent: roundPercent(variancePercent),
  }
}

export function buildSavingsMetrics(context) {
  const totalSavings = sumSavings(context.savings.current)
  const savingsCount = context.savings.current.length
  const totalIncome = sumIncome(context.income.current)
  const previousCutoffComparison =
    context.savings.hasComparisonPeriod && context.savings.comparison.length > 0
      ? calculateSavingsComparison(totalSavings, sumSavings(context.savings.comparison))
      : {
          direction: SAVINGS_TREND.noData,
          currentTotal: totalSavings,
          comparisonTotal: 0,
          difference: 0,
          percentageChange: 0,
        }
  const contributionFrequency = calculateContributionFrequency({
    currentCutoff: context.currentCutoff,
    savingsRecords: context.savings.current,
  })

  return {
    totalSavings,
    savingsCount,
    averageContribution: savingsCount
      ? roundCurrency(totalSavings / savingsCount)
      : 0,
    savingsRate: calculateSavingsRate({
      totalIncome,
      totalSavings,
    }),
    trend: previousCutoffComparison,
    previousCutoffComparison,
    contributionFrequency,
    largestSavingsContribution: getLargestSavingsContribution(context.savings.current),
    consistency: {
      ...calculateSavingsConsistency({
        savingsCount,
        previousComparison: previousCutoffComparison,
      }),
      contributionDays: contributionFrequency.activeContributionDays,
    },
  }
}
