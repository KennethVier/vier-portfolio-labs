import {
  CASHFLOW_POSITION,
  CASHFLOW_STABILITY,
  COVERAGE_STATUS,
  SPENDING_PACE_STATUS,
  createEmptyCashflowMetrics,
} from '../../models/cashflowInsight.js'

const DAY_MS = 86400000
const PACE_TOLERANCE_PERCENT = 10

function getNumber(value) {
  return Number(value) || 0
}

function round(value, precision = 2) {
  const factor = 10 ** precision
  return Math.round((value + Number.EPSILON) * factor) / factor
}

function parseDate(value) {
  if (!value) {
    return null
  }

  const date = value instanceof Date ? value : new Date(`${value}T00:00:00.000Z`)

  return Number.isNaN(date.getTime()) ? null : date
}

function buildSpendingPace({ actualIncome, currentCutoff, today, totalExpenses }) {
  if (!currentCutoff || actualIncome <= 0) {
    return createEmptyCashflowMetrics().spendingPace
  }

  const startDate = parseDate(currentCutoff.startDate)
  const endDate = parseDate(currentCutoff.endDate)
  const currentDate = parseDate(today)

  if (!startDate || !endDate || !currentDate || endDate < startDate) {
    return createEmptyCashflowMetrics().spendingPace
  }

  const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / DAY_MS) + 1
  const rawElapsedDays = Math.floor((currentDate.getTime() - startDate.getTime()) / DAY_MS) + 1
  const elapsedDays = Math.min(totalDays, Math.max(1, rawElapsedDays))
  const elapsedPercent = round((elapsedDays / totalDays) * 100)
  const spendingPercent = round((totalExpenses / actualIncome) * 100)
  const paceDelta = round(spendingPercent - elapsedPercent)

  let status = SPENDING_PACE_STATUS.onPace

  if (paceDelta > PACE_TOLERANCE_PERCENT) {
    status = SPENDING_PACE_STATUS.fast
  } else if (paceDelta < -PACE_TOLERANCE_PERCENT) {
    status = SPENDING_PACE_STATUS.slow
  }

  return {
    status,
    dailySpendingRate: round(totalExpenses / elapsedDays),
    elapsedDays,
    totalDays,
    elapsedPercent,
    spendingPercent,
    paceDelta,
  }
}

function buildIncomeCoverage({ actualIncome, totalExpenses, totalSavings }) {
  const requiredOutflows = totalExpenses + totalSavings

  if (actualIncome <= 0 && requiredOutflows <= 0) {
    return createEmptyCashflowMetrics().incomeCoverage
  }

  const coveragePercent = requiredOutflows <= 0
    ? 100
    : round((actualIncome / requiredOutflows) * 100)

  return {
    status:
      coveragePercent >= 100
        ? COVERAGE_STATUS.covered
        : actualIncome > 0
          ? COVERAGE_STATUS.partial
          : COVERAGE_STATUS.uncovered,
    actualIncome,
    requiredOutflows,
    coveragePercent,
  }
}

function buildSavingsCoverage({ actualIncome, totalExpenses, totalSavings }) {
  if (totalSavings <= 0) {
    return createEmptyCashflowMetrics().savingsCoverage
  }

  const availableAfterExpenses = actualIncome - totalExpenses
  const coveragePercent = round((availableAfterExpenses / totalSavings) * 100)

  return {
    status:
      coveragePercent >= 100
        ? COVERAGE_STATUS.covered
        : coveragePercent > 0
          ? COVERAGE_STATUS.partial
          : COVERAGE_STATUS.uncovered,
    availableAfterExpenses,
    totalSavings,
    coveragePercent,
  }
}

function getPosition(remainingCash) {
  if (remainingCash > 0) {
    return CASHFLOW_POSITION.positive
  }

  if (remainingCash < 0) {
    return CASHFLOW_POSITION.negative
  }

  return CASHFLOW_POSITION.balanced
}

function buildStability({ incomeCoverage, position, spendingPace }) {
  if (
    position === CASHFLOW_POSITION.noData ||
    incomeCoverage.status === COVERAGE_STATUS.noData
  ) {
    return {
      status: CASHFLOW_STABILITY.noData,
      reason: 'Cashflow stability needs current-cutoff financial activity.',
    }
  }

  if (
    position === CASHFLOW_POSITION.negative ||
    incomeCoverage.status === COVERAGE_STATUS.uncovered
  ) {
    return {
      status: CASHFLOW_STABILITY.unstable,
      reason: 'Current income does not cover recorded expenses and savings.',
    }
  }

  if (
    incomeCoverage.status === COVERAGE_STATUS.partial ||
    spendingPace.status === SPENDING_PACE_STATUS.fast
  ) {
    return {
      status: CASHFLOW_STABILITY.strained,
      reason: 'Cashflow is positive but current coverage or spending pace needs attention.',
    }
  }

  return {
    status: CASHFLOW_STABILITY.stable,
    reason: 'Current cashflow remains covered without elevated spending pace.',
  }
}

export function buildCashflowMetrics(context) {
  if (!context.currentCutoff || !context.cashflow) {
    return createEmptyCashflowMetrics()
  }

  const actualIncome = getNumber(context.cashflow.actualIncome)
  const totalExpenses = getNumber(context.cashflow.totalExpenses)
  const totalSavings = getNumber(context.cashflow.totalSavings)
  const remainingCash = getNumber(context.cashflow.remainingCash)
  const netCashflow = actualIncome - totalExpenses
  const position = getPosition(remainingCash)
  const spendingPace = buildSpendingPace({
    actualIncome,
    currentCutoff: context.currentCutoff,
    today: context.today,
    totalExpenses,
  })
  const incomeCoverage = buildIncomeCoverage({
    actualIncome,
    totalExpenses,
    totalSavings,
  })
  const savingsCoverage = buildSavingsCoverage({
    actualIncome,
    totalExpenses,
    totalSavings,
  })

  return {
    remainingCash,
    netCashflow,
    position,
    spendingPace,
    incomeCoverage,
    savingsCoverage,
    stability: buildStability({
      incomeCoverage,
      position,
      spendingPace,
    }),
  }
}

export const cashflowMetricsInternals = {
  buildIncomeCoverage,
  buildSavingsCoverage,
  buildSpendingPace,
  buildStability,
  getPosition,
}
