import { DEFAULT_INSIGHT_SCOPE } from '../../utils/insightConstants.js'
import { aggregateCutoffRules } from './cutoffAggregator.js'
import { buildCutoffContext } from './cutoffContextBuilder.js'
import { buildCutoffMetrics } from './cutoffMetrics.js'
import { cutoffRuleRegistry } from './cutoffRuleRegistry.js'

export async function generateCutoffInsight({
  scope = DEFAULT_INSIGHT_SCOPE,
} = {}) {
  const context = await buildCutoffContext({ scope })
  const metrics = buildCutoffMetrics(context)
  const contextWithMetrics = {
    ...context,
    metrics,
  }
  const ruleResults = cutoffRuleRegistry.map((rule) =>
    rule.evaluate(contextWithMetrics, rule.weight),
  )

  return aggregateCutoffRules({
    context,
    metrics,
    ruleResults,
    scope,
  })
}
