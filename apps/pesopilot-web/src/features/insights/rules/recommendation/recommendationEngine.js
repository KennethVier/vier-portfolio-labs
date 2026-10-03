import { createRecommendationBundle } from '../../models/recommendationBundle.js'
import { DEFAULT_INSIGHT_SCOPE } from '../../utils/insightConstants.js'
import { resolveRecommendationConflicts } from './recommendationConflictResolver.js'
import {
  buildRecommendationGroups,
  formatRecommendation,
} from './recommendationFormatter.js'
import { recommendationRuleRegistry } from './recommendationRuleRegistry.js'

export function generateRecommendations(insightBundle) {
  if (!insightBundle || typeof insightBundle !== 'object') {
    return createRecommendationBundle()
  }

  const scope = insightBundle.scope ?? DEFAULT_INSIGHT_SCOPE
  const generatedAt =
    insightBundle.generatedAt ?? new Date().toISOString()

  // Evaluate deterministic rules across registered domains
  const candidates = []
  for (const rule of recommendationRuleRegistry) {
    const result = rule.evaluate(insightBundle)
    if (result) {
      candidates.push(result)
    }
  }

  // Deterministic conflict resolution, deduplication, and ranking
  const { recommendations: rawRecommendations, suppressed } =
    resolveRecommendationConflicts(candidates)

  // Format recommendations
  const recommendations = rawRecommendations.map(formatRecommendation)

  // Group by domain
  const groups = buildRecommendationGroups(recommendations)

  return createRecommendationBundle({
    scope,
    generatedAt,
    recommendations,
    groups,
    suppressed,
  })
}
