import { incomeService } from '@/features/income/services/incomeService.js'
import { cutoffService } from '@/features/salary-cutoff/services/cutoffService.js'

function isSameCutoff(record, cutoff) {
  return Boolean(
    record.cutoffId &&
      cutoff?.id &&
      String(record.cutoffId) === String(cutoff.id),
  )
}

function findPreviousCutoff(cutoffs, currentCutoff) {
  if (!currentCutoff) {
    return null
  }

  return [...cutoffs]
    .filter((cutoff) => cutoff.endDate < currentCutoff.startDate)
    .sort((firstCutoff, secondCutoff) => {
      if (secondCutoff.endDate === firstCutoff.endDate) {
        return (secondCutoff.id ?? 0) - (firstCutoff.id ?? 0)
      }

      return secondCutoff.endDate.localeCompare(firstCutoff.endDate)
    })[0] ?? null
}

function getMonthKey(date) {
  return String(date ?? '').slice(0, 7) || null
}

function getPreviousMonthKey(monthKey) {
  if (!monthKey) {
    return null
  }

  const [year, month] = monthKey.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 2, 1))

  return date.toISOString().slice(0, 7)
}

export async function buildIncomeContext({ scope } = {}) {
  const [incomeRecords, cutoffs, currentCutoff] = await Promise.all([
    incomeService.loadIncome(),
    incomeService.loadSalaryCutoffs(),
    cutoffService.findCurrentCutoff(),
  ])
  const previousCutoff = findPreviousCutoff(cutoffs, currentCutoff)
  const currentMonth = getMonthKey(currentCutoff?.startDate)
  const previousMonth = getPreviousMonthKey(currentMonth)
  const warnings = []

  if (!currentCutoff) {
    warnings.push('No current cutoff')
  }

  if (currentCutoff && !previousCutoff) {
    warnings.push('No previous cutoff')
  }

  if (currentCutoff && !previousMonth) {
    warnings.push('No previous month')
  }

  return {
    scope,
    currentCutoff,
    previousCutoff,
    cutoffs,
    income: {
      all: incomeRecords,
      current: currentCutoff
        ? incomeRecords.filter((income) => isSameCutoff(income, currentCutoff))
        : [],
      comparison: previousCutoff
        ? incomeRecords.filter((income) => isSameCutoff(income, previousCutoff))
        : [],
      currentMonth: currentMonth
        ? incomeRecords.filter((income) => getMonthKey(income.date) === currentMonth)
        : [],
      previousMonth: previousMonth
        ? incomeRecords.filter((income) => getMonthKey(income.date) === previousMonth)
        : [],
      hasComparisonPeriod: Boolean(previousCutoff),
      hasMonthlyComparisonPeriod: Boolean(previousMonth),
    },
    period: {
      currentMonth,
      previousMonth,
    },
    diagnostics: {
      warnings,
    },
  }
}
