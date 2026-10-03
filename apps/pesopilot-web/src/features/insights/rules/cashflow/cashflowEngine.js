import { DEFAULT_INSIGHT_SCOPE } from '../../utils/insightConstants.js'
import { aggregateCashflowRules } from './cashflowAggregator.js'
import { buildCashflowContext } from './cashflowContextBuilder.js'
import { buildCashflowMetrics } from './cashflowMetrics.js'
import { cashflowRuleRegistry } from './cashflowRuleRegistry.js'

export async function generateCashflowInsight({
  scope = DEFAULT_INSIGHT_SCOPE,
  today = new Date(),
} = {}) {
  const context = await buildCashflowContext({ scope, today })
  const metrics = buildCashflowMetrics(context)
  const contextWithMetrics = {
    ...context,
    metrics,
  }
  const ruleResults = cashflowRuleRegistry.map((rule) =>
    rule.evaluate(contextWithMetrics, rule.weight),
  )

  return aggregateCashflowRules({
    context,
    metrics,
    ruleResults,
    scope,
  })
}
