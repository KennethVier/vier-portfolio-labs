import { expenseService } from '@/features/expenses/services/expenseService.js'
import { cutoffService } from '@/features/salary-cutoff/services/cutoffService.js'

function isSameCutoff(record, cutoff) {
  return Boolean(
    record.cutoffId &&
      cutoff?.id &&
      String(record.cutoffId) === String(cutoff.id),
  )
}

function parseIsoDate(value) {
  return new Date(`${value}T00:00:00.000Z`)
}

function getInclusiveDays(startDate, endDate) {
  if (!startDate || !endDate) {
    return 0
  }

  const start = parseIsoDate(startDate)
  const end = parseIsoDate(endDate)
  const millisecondsPerDay = 24 * 60 * 60 * 1000
  const days = Math.floor((end - start) / millisecondsPerDay) + 1

  return Math.max(0, days)
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

export async function buildExpenseContext({ scope } = {}) {
  const [expenses, categories, currentCutoff, cutoffResult] = await Promise.all([
    expenseService.loadExpenses(),
    expenseService.loadCategories(),
    cutoffService.findCurrentCutoff(),
    cutoffService.loadCutoffs(),
  ])
  const previousCutoff = findPreviousCutoff(
    cutoffResult.cutoffs ?? [],
    currentCutoff,
  )
  const warnings = []

  if (!currentCutoff) {
    warnings.push('No current cutoff')
  }

  if (currentCutoff && !previousCutoff) {
    warnings.push('No previous cutoff')
  }

  return {
    scope,
    categories,
    currentCutoff,
    previousCutoff,
    expenses: {
      all: expenses,
      current: currentCutoff
        ? expenses.filter((expense) => isSameCutoff(expense, currentCutoff))
        : [],
      comparison: previousCutoff
        ? expenses.filter((expense) => isSameCutoff(expense, previousCutoff))
        : [],
      hasComparisonPeriod: Boolean(previousCutoff),
    },
    period: {
      currentPeriodDays: currentCutoff
        ? getInclusiveDays(currentCutoff.startDate, currentCutoff.endDate)
        : 0,
    },
    diagnostics: {
      warnings,
    },
  }
}
