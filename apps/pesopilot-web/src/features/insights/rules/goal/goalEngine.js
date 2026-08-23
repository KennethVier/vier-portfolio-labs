import { DEFAULT_INSIGHT_SCOPE } from '../../utils/insightConstants.js'
import { aggregateGoalRules } from './goalAggregator.js'
import { buildGoalContext } from './goalContextBuilder.js'
import { buildGoalMetrics } from './goalMetrics.js'
import { goalRuleRegistry } from './goalRuleRegistry.js'

export async function generateGoalInsight({ scope = DEFAULT_INSIGHT_SCOPE } = {}) {
  const context = await buildGoalContext({ scope })
  const metrics = buildGoalMetrics(context)
  const contextWithMetrics = {
    ...context,
    metrics,
  }
  const ruleResults = goalRuleRegistry.map((rule) =>
    rule.evaluate(contextWithMetrics, rule.weight),
  )

  return aggregateGoalRules({
    context,
    metrics,
    ruleResults,
    scope,
  })
}
