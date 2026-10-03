import { cashflowService } from '@/features/cashflow/services/cashflowService.js'
import { cutoffService } from '@/features/salary-cutoff/services/cutoffService.js'

function toIsoDate(value) {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10)
  }

  return String(value).slice(0, 10)
}

export async function buildCashflowContext({ scope, today = new Date() } = {}) {
  const currentCutoff = await cutoffService.findCurrentCutoff(toIsoDate(today))
  const warnings = []

  if (!currentCutoff) {
    warnings.push('No current cutoff')

    return {
      scope,
      currentCutoff: null,
      cashflow: null,
      today,
      diagnostics: {
        warnings,
      },
    }
  }

  const cashflowResult = await cashflowService.calculateCashflowForCutoff(currentCutoff.id)

  if (!cashflowResult?.cashflow) {
    warnings.push('No cashflow data')
  }

  return {
    scope,
    currentCutoff,
    cashflow: cashflowResult?.cashflow ?? null,
    today,
    diagnostics: {
      warnings,
    },
  }
}

export const cashflowContextBuilderInternals = {
  toIsoDate,
}
