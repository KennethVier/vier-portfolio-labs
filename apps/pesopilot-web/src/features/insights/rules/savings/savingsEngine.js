import { DEFAULT_INSIGHT_SCOPE } from '../../utils/insightConstants.js'
import { aggregateSavingsRules } from './savingsAggregator.js'
import { buildSavingsContext } from './savingsContextBuilder.js'
import { buildSavingsMetrics } from './savingsMetrics.js'
import { savingsRuleRegistry } from './savingsRuleRegistry.js'

export async function generateSavingsInsight({ scope = DEFAULT_INSIGHT_SCOPE } = {}) {
  const context = await buildSavingsContext({ scope })
  const metrics = buildSavingsMetrics(context)
  const contextWithMetrics = {
    ...context,
    metrics,
  }
  const ruleResults = savingsRuleRegistry.map((rule) =>
    rule.evaluate(contextWithMetrics, rule.weight),
  )

  return aggregateSavingsRules({
    context,
    metrics,
    ruleResults,
    scope,
  })
}
