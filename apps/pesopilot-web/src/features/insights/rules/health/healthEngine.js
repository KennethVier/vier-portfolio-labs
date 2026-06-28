import { DEFAULT_INSIGHT_SCOPE } from '../../utils/insightConstants.js'
import { aggregateHealthRules } from './healthAggregator.js'
import { buildHealthContext } from './healthContextBuilder.js'
import { healthRuleRegistry } from './healthRuleRegistry.js'

export async function generateHealthInsight({ scope = DEFAULT_INSIGHT_SCOPE } = {}) {
  const context = await buildHealthContext({ scope })
  const ruleResults = healthRuleRegistry.map((rule) =>
    rule.evaluate(context, rule.weight),
  )

  return aggregateHealthRules({
    ruleResults,
    scope,
  })
}
