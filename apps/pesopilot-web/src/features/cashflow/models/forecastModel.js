const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

function isValidIsoDate(value) {
  return typeof value === 'string' && DATE_REGEX.test(value.trim())
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value)
}

function isNonNegativeInteger(value) {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
}

export function createForecastModel(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Forecast data must be a non-null object')
  }

  if (data.cutoffId === null || data.cutoffId === undefined || data.cutoffId === '') {
    throw new Error('Forecast requires a valid cutoffId')
  }

  if (!isValidIsoDate(data.startDate)) {
    throw new Error(`Forecast requires a valid startDate (YYYY-MM-DD), received: ${data.startDate}`)
  }

  if (!isValidIsoDate(data.endDate)) {
    throw new Error(`Forecast requires a valid endDate (YYYY-MM-DD), received: ${data.endDate}`)
  }

  if (!isValidIsoDate(data.asOfDate)) {
    throw new Error(`Forecast requires a valid asOfDate (YYYY-MM-DD), received: ${data.asOfDate}`)
  }

  if (!isNonNegativeInteger(data.totalDays)) {
    throw new Error(`Forecast requires non-negative integer totalDays, received: ${data.totalDays}`)
  }

  if (!isNonNegativeInteger(data.elapsedDays) || data.elapsedDays > data.totalDays) {
    throw new Error(
      `Forecast requires elapsedDays to be between 0 and totalDays (${data.totalDays}), received: ${data.elapsedDays}`,
    )
  }

  if (!isNonNegativeInteger(data.remainingDays)) {
    throw new Error(`Forecast requires non-negative integer remainingDays, received: ${data.remainingDays}`)
  }

  const monetaryFields = [
    'expectedIncome',
    'actualIncome',
    'totalExpenses',
    'totalSavings',
    'availableCash',
    'dailyBurnRate',
    'safeDailySpend',
    'projectedRemaining',
    'projectedDeficit',
  ]

  for (const field of monetaryFields) {
    if (!isFiniteNumber(data[field])) {
      throw new Error(`Forecast field "${field}" must be a finite number, received: ${data[field]}`)
    }
  }

  if (data.projectedDeficit < 0) {
    throw new Error(`projectedDeficit cannot be negative, received: ${data.projectedDeficit}`)
  }

  return Object.freeze({
    version: '1.0.0',
    cutoffId: data.cutoffId,
    cutoffName: data.cutoffName ?? '',
    startDate: data.startDate,
    endDate: data.endDate,
    asOfDate: data.asOfDate,
    totalDays: data.totalDays,
    elapsedDays: data.elapsedDays,
    remainingDays: data.remainingDays,
    expectedIncome: data.expectedIncome,
    actualIncome: data.actualIncome,
    totalExpenses: data.totalExpenses,
    totalSavings: data.totalSavings,
    availableCash: data.availableCash,
    dailyBurnRate: data.dailyBurnRate,
    safeDailySpend: data.safeDailySpend,
    projectedRemaining: data.projectedRemaining,
    projectedDeficit: data.projectedDeficit,
  })
}
