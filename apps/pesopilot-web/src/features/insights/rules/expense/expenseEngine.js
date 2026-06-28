import { DEFAULT_INSIGHT_SCOPE } from '../../utils/insightConstants.js'
import { aggregateExpenseRules } from './expenseAggregator.js'
import { buildExpenseContext } from './expenseContextBuilder.js'
import { buildExpenseMetrics } from './expenseMetrics.js'
import { expenseRuleRegistry } from './expenseRuleRegistry.js'

export async function generateExpenseInsight({ scope = DEFAULT_INSIGHT_SCOPE } = {}) {
  const context = await buildExpenseContext({ scope })
  const metrics = buildExpenseMetrics(context)
  const contextWithMetrics = {
    ...context,
    metrics,
  }
  const ruleResults = expenseRuleRegistry.map((rule) =>
    rule.evaluate(contextWithMetrics, rule.weight),
  )

  return aggregateExpenseRules({
    context,
    metrics,
    ruleResults,
    scope,
  })
}
