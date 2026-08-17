import { DEFAULT_INSIGHT_SCOPE } from '../../utils/insightConstants.js'
import { aggregateIncomeRules } from './incomeAggregator.js'
import { buildIncomeContext } from './incomeContextBuilder.js'
import { buildIncomeMetrics } from './incomeMetrics.js'
import { incomeRuleRegistry } from './incomeRuleRegistry.js'

export async function generateIncomeInsight({ scope = DEFAULT_INSIGHT_SCOPE } = {}) {
  const context = await buildIncomeContext({ scope })
  const metrics = buildIncomeMetrics(context)
  const contextWithMetrics = {
    ...context,
    metrics,
  }
  const ruleResults = incomeRuleRegistry.map((rule) =>
    rule.evaluate(contextWithMetrics, rule.weight),
  )

  return aggregateIncomeRules({
    context,
    metrics,
    ruleResults,
    scope,
  })
}
