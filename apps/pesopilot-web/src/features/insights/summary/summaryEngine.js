import { DEFAULT_INSIGHT_SCOPE } from '../utils/insightConstants.js'
import {
  buildEmptyFinancialSummary,
  buildReadyFinancialSummary,
} from './summaryBuilder.js'
import {
  buildCandidateSections,
  hasSufficientFinancialData,
} from './summarySectionBuilder.js'
import { composeNarrative } from './narrativeComposer.js'
import { validateFinancialSummary } from './summaryValidator.js'

export function generateFinancialSummary({
  insightBundle,
  recommendationBundle,
} = {}) {
  const scope = insightBundle?.scope ?? DEFAULT_INSIGHT_SCOPE
  const generatedAt =
    insightBundle?.generatedAt ??
    recommendationBundle?.generatedAt ??
    new Date().toISOString()

  // 1. Empty data gate: verify bundle has sufficient financial data
  if (
    !insightBundle ||
    typeof insightBundle !== 'object' ||
    !hasSufficientFinancialData(insightBundle)
  ) {
    const emptySummary = buildEmptyFinancialSummary({ generatedAt, scope })
    validateFinancialSummary({
      financialSummary: emptySummary,
      insightBundle,
      recommendationBundle,
    })
    return emptySummary
  }

  // 2. Extract deterministic narrative candidates
  const { candidates, coverage, state } = buildCandidateSections({
    insightBundle,
    recommendationBundle,
  })

  if (state === 'empty' || candidates.length === 0) {
    const emptySummary = buildEmptyFinancialSummary({ generatedAt, scope })
    validateFinancialSummary({
      financialSummary: emptySummary,
      insightBundle,
      recommendationBundle,
    })
    return emptySummary
  }

  // 3. Compose sections, handle ranking, deduplication, and tone
  const { counts, omitted, sections } = composeNarrative({ candidates })

  // 4. Assemble the FinancialSummary DTO
  const summary = buildReadyFinancialSummary({
    counts,
    coverage,
    generatedAt,
    omitted,
    scope,
    sections,
  })

  // 5. Validate the assembled summary against source bundles
  const validation = validateFinancialSummary({
    financialSummary: summary,
    insightBundle,
    recommendationBundle,
  })

  if (!validation.valid) {
    return buildEmptyFinancialSummary({
      generatedAt,
      scope,
      warnings: ['validation_failed'],
    })
  }

  return summary
}
