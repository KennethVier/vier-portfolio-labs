import { incomeService } from '@/features/income/services/incomeService.js'
import { savingsService } from '@/features/savings/services/savingsService.js'
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

export async function buildSavingsContext({ scope } = {}) {
  const [savingsRecords, incomeRecords, cutoffResult] = await Promise.all([
    savingsService.loadSavings(),
    incomeService.loadIncome(),
    cutoffService.loadCutoffs(),
  ])
  const cutoffs = cutoffResult.cutoffs ?? []
  const currentCutoff = cutoffResult.currentCutoff ?? null
  const previousCutoff = findPreviousCutoff(cutoffs, currentCutoff)
  const warnings = []

  if (!currentCutoff) {
    warnings.push('No current cutoff')
  }

  if (currentCutoff && !previousCutoff) {
    warnings.push('No previous cutoff')
  }

  return {
    scope,
    currentCutoff,
    previousCutoff,
    cutoffs,
    savings: {
      all: savingsRecords,
      current: currentCutoff
        ? savingsRecords.filter((savings) => isSameCutoff(savings, currentCutoff))
        : [],
      comparison: previousCutoff
        ? savingsRecords.filter((savings) => isSameCutoff(savings, previousCutoff))
        : [],
      hasComparisonPeriod: Boolean(previousCutoff),
    },
    income: {
      all: incomeRecords,
      current: currentCutoff
        ? incomeRecords.filter((income) => isSameCutoff(income, currentCutoff))
        : [],
    },
    diagnostics: {
      warnings,
    },
  }
}
