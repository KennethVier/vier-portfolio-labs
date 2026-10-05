import { createForecastModel } from '../models/forecastModel.js'

const DATE_PARTS = /^(\d{4})-(\d{2})-(\d{2})$/
const DAY_MS = 86400000

function parseIsoDate(value) {
  if (typeof value !== 'string') {
    throw new Error(`Invalid date value: ${value}`)
  }

  const match = DATE_PARTS.exec(value.trim().slice(0, 10))
  if (!match) {
    throw new Error(`Invalid ISO date string: ${value}`)
  }

  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
}

function countInclusiveDays(startDateStr, endDateStr) {
  const start = parseIsoDate(startDateStr)
  const end = parseIsoDate(endDateStr)

  if (end.getTime() < start.getTime()) {
    throw new Error(`startDate (${startDateStr}) must be on or before endDate (${endDateStr})`)
  }

  return Math.floor((end.getTime() - start.getTime()) / DAY_MS) + 1
}

function validateMonetaryInput(value, fieldName) {
  if (value === undefined || value === null) {
    return 0
  }

  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`Forecast input "${fieldName}" must be a finite number, received: ${value}`)
  }

  return value
}

function roundMoney(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`roundMoney requires a finite number, received: ${value}`)
  }

  const rounded = Math.round((value + Number.EPSILON) * 100) / 100
  return Object.is(rounded, -0) ? 0 : rounded
}

function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Pure deterministic cashflow forecast engine.
 *
 * Elapsed day semantics (Option B: Explicit Forecast Clamp):
 * - If asOfDate < startDate: 0 days elapsed, totalDays remain, dailyBurnRate is 0.
 * - If asOfDate >= endDate: totalDays elapsed, 0 days remain, projectedRemaining is availableCash.
 * - Otherwise: inclusive days from startDate to asOfDate.
 *
 * Intermediate vs public rounding contract:
 * - rawDailyBurnRate (unrounded) is used for projectedRemaining calculation to prevent
 *   accumulated cent truncation errors.
 * - Public returned values (dailyBurnRate, safeDailySpend, projectedRemaining, projectedDeficit)
 *   are all strictly rounded to 2 decimal places.
 */
export function calculateForecast(input) {
  if (!input || typeof input !== 'object') {
    throw new Error('Forecast input must be a non-null object')
  }

  const {
    cutoffId,
    cutoffName = '',
    startDate,
    endDate,
    asOfDate = getTodayIsoDate(),
    expectedIncome = 0,
    actualIncome = 0,
    totalExpenses = 0,
    totalSavings = 0,
  } = input

  const safeExpectedIncome = roundMoney(validateMonetaryInput(expectedIncome, 'expectedIncome'))
  const safeActualIncome = roundMoney(validateMonetaryInput(actualIncome, 'actualIncome'))
  const safeTotalExpenses = roundMoney(validateMonetaryInput(totalExpenses, 'totalExpenses'))
  const safeTotalSavings = roundMoney(validateMonetaryInput(totalSavings, 'totalSavings'))

  const availableCash = roundMoney(safeActualIncome - safeTotalExpenses - safeTotalSavings)

  const totalDays = countInclusiveDays(startDate, endDate)

  let elapsedDays = 0
  if (asOfDate < startDate) {
    elapsedDays = 0
  } else if (asOfDate >= endDate) {
    elapsedDays = totalDays
  } else {
    elapsedDays = countInclusiveDays(startDate, asOfDate)
  }

  const remainingDays = Math.max(0, totalDays - elapsedDays)

  // Unrounded rate for mathematically complete projection calculation
  const rawDailyBurnRate = elapsedDays > 0 ? safeTotalExpenses / elapsedDays : 0
  const dailyBurnRate = roundMoney(rawDailyBurnRate)

  const safeDailySpend =
    remainingDays > 0 && availableCash > 0 ? roundMoney(availableCash / remainingDays) : 0

  // Final projection rounded after unrounded rate arithmetic
  const projectedRemaining = roundMoney(availableCash - rawDailyBurnRate * remainingDays)

  const projectedDeficit =
    projectedRemaining < 0 ? roundMoney(Math.abs(projectedRemaining)) : 0

  return createForecastModel({
    cutoffId,
    cutoffName,
    startDate,
    endDate,
    asOfDate,
    totalDays,
    elapsedDays,
    remainingDays,
    expectedIncome: safeExpectedIncome,
    actualIncome: safeActualIncome,
    totalExpenses: safeTotalExpenses,
    totalSavings: safeTotalSavings,
    availableCash,
    dailyBurnRate,
    safeDailySpend,
    projectedRemaining,
    projectedDeficit,
  })
}

export const forecastEngine = {
  calculateForecast,
}

export const forecastEngineInternals = {
  countInclusiveDays,
  parseIsoDate,
  roundMoney,
  validateMonetaryInput,
}
