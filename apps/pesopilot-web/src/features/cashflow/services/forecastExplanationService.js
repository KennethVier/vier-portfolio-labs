const currencyFormatter = new Intl.NumberFormat('en-PH', {
  currency: 'PHP',
  style: 'currency',
})

function formatMoney(amount) {
  return currencyFormatter.format(amount ?? 0)
}

export function generateForecastExplanation(forecast) {
  if (!forecast || typeof forecast !== 'object') {
    throw new Error('ForecastExplanation requires a valid forecast object')
  }

  const {
    availableCash,
    dailyBurnRate,
    endDate,
    projectedDeficit,
    projectedRemaining,
    remainingDays,
    safeDailySpend,
    startDate,
    totalDays,
    totalExpenses,
  } = forecast

  const dayWord = remainingDays === 1 ? 'day' : 'days'

  if (remainingDays === 0) {
    return Object.freeze({
      headline: `Cutoff complete: final remaining cash is ${formatMoney(availableCash)}`,
      summary: `The cutoff cycle ended on ${endDate}. Final recorded available cash is ${formatMoney(availableCash)}.`,
      details: Object.freeze([
        `Total recorded expenses: ${formatMoney(totalExpenses)} across ${totalDays} days.`,
        `Average spending pace: ${formatMoney(dailyBurnRate)}/day.`,
        `Cutoff period: ${startDate} to ${endDate}.`,
      ]),
    })
  }

  if (totalExpenses === 0) {
    return Object.freeze({
      headline: `Projected remaining cash at cutoff end: ${formatMoney(projectedRemaining)}`,
      summary: `No expenses have been recorded yet for this cutoff. Your current safe daily spend is ${formatMoney(safeDailySpend)}/day across ${remainingDays} remaining ${dayWord}.`,
      details: Object.freeze([
        `Available cash: ${formatMoney(availableCash)}.`,
        `Safe daily spend: ${formatMoney(safeDailySpend)}/day to maintain available cash through ${endDate}.`,
        `Cutoff period: ${startDate} to ${endDate} (${totalDays} total days).`,
      ]),
    })
  }

  if (projectedRemaining < 0) {
    return Object.freeze({
      headline: `Projected shortfall of ${formatMoney(projectedDeficit)} at cutoff end`,
      summary: `At your current recorded spending pace of ${formatMoney(dailyBurnRate)}/day, the projection reaches ${formatMoney(projectedRemaining)} by the end of this cutoff.`,
      details: Object.freeze([
        `Available cash: ${formatMoney(availableCash)} across ${remainingDays} remaining ${dayWord}.`,
        `Safe daily spend: ${formatMoney(safeDailySpend)}/day based on cash already recorded.`,
        `Cutoff period: ${startDate} to ${endDate} (${totalDays} total days).`,
      ]),
    })
  }

  return Object.freeze({
    headline: `Projected remaining cash at cutoff end: ${formatMoney(projectedRemaining)}`,
    summary: `At your current recorded spending pace of ${formatMoney(dailyBurnRate)}/day, your projected remaining cash at cutoff end is ${formatMoney(projectedRemaining)}.`,
    details: Object.freeze([
      `Available cash: ${formatMoney(availableCash)} across ${remainingDays} remaining ${dayWord}.`,
      `Safe daily spend: ${formatMoney(safeDailySpend)}/day to maintain positive cashflow through ${endDate}.`,
      `Cutoff period: ${startDate} to ${endDate} (${totalDays} total days).`,
    ]),
  })
}

export const forecastExplanationService = {
  generateForecastExplanation,
}

export const forecastExplanationInternals = {
  formatMoney,
}
