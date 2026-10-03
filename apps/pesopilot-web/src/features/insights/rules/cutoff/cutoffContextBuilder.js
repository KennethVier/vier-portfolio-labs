import { cashflowService } from '@/features/cashflow/services/cashflowService.js'
import { cutoffService } from '@/features/salary-cutoff/services/cutoffService.js'

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

// Reuses cashflowService as the single source of income/expense/savings totals.
async function loadSnapshot(cutoff) {
  const result = await cashflowService.calculateCashflowForCutoff(cutoff.id)
  const cashflow = result?.cashflow

  if (!cashflow) {
    return null
  }

  const income = Number(cashflow.actualIncome) || 0
  const expenses = Number(cashflow.totalExpenses) || 0
  const savings = Number(cashflow.totalSavings) || 0

  return {
    cutoffId: cutoff.id,
    cutoffName: cutoff.name,
    startDate: cutoff.startDate,
    endDate: cutoff.endDate,
    status: cutoff.status,
    income,
    expenses,
    savings,
    remainingCash: Number(cashflow.remainingCash) || 0,
    hasData: income > 0 || expenses > 0 || savings > 0,
  }
}

export async function buildCutoffContext({ scope } = {}) {
  const cutoffResult = await cutoffService.loadCutoffs()
  const cutoffs = cutoffResult.cutoffs ?? []
  const currentCutoff = cutoffResult.currentCutoff ?? null
  const previousCutoff = findPreviousCutoff(cutoffs, currentCutoff)
  const warnings = []

  if (!currentCutoff) {
    warnings.push('No current cutoff')

    return {
      scope,
      currentCutoff: null,
      previousCutoff: null,
      current: null,
      previous: null,
      history: [],
      diagnostics: { warnings },
    }
  }

  const priorCutoffs = cutoffs
    .filter((cutoff) => cutoff.endDate < currentCutoff.startDate)
    .sort((first, second) => second.endDate.localeCompare(first.endDate))
  const [current, ...historySnapshots] = await Promise.all([
    loadSnapshot(currentCutoff),
    ...priorCutoffs.map(loadSnapshot),
  ])
  const history = historySnapshots.filter(Boolean)
  const previous = history.find((snapshot) => snapshot.hasData) ?? null

  if (!current?.hasData) {
    warnings.push('No current cutoff data')
  }

  if (!previousCutoff) {
    warnings.push('No previous cutoff')
  } else if (!previous?.hasData) {
    warnings.push('No previous cutoff data')
  }

  return {
    scope,
    currentCutoff,
    previousCutoff,
    current,
    previous,
    history,
    diagnostics: { warnings },
  }
}
