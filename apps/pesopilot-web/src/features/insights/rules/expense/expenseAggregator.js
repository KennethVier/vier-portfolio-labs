import { createExpenseInsight } from '../../models/expenseInsight.js'
import { INSIGHT_SEVERITY } from '../../utils/insightSeverity.js'

function buildBreakdown(ruleResults) {
  return ruleResults.map((rule) => ({
    id: rule.id,
    label: rule.ruleName,
    score: rule.score,
    status: rule.status,
    severity: rule.severity,
    weight: rule.weight,
  }))
}

function buildExplanation(metrics) {
  if (metrics.expenseCount === 0) {
    return 'No expenses are recorded for this scope yet.'
  }

  const categoryText = metrics.topSpendingCategory
    ? `${metrics.topSpendingCategory.categoryName} is the top spending category.`
    : 'No top spending category is available.'
  const trendText =
    metrics.trend.direction === 'No Data'
      ? 'A comparison trend is not available yet.'
      : `Expense trend is ${metrics.trend.direction.toLowerCase()} versus the previous cutoff.`
  const anomalyText =
    metrics.anomalies.length > 0
      ? `${metrics.anomalies.length} spending anomalies were detected.`
      : 'No spending anomalies were detected.'

  return `${categoryText} ${trendText} ${anomalyText}`
}

export function aggregateExpenseRules({ context, metrics, ruleResults, scope }) {
  const evidence = ruleResults.flatMap((rule) =>
    rule.evidence.map((item) => ({
      ruleId: rule.id,
      ...item,
    })),
  )

  return createExpenseInsight({
    breakdown: buildBreakdown(ruleResults),
    diagnostics: {
      executedRules: ruleResults.map((rule) => rule.id),
      warnings: context.diagnostics.warnings,
    },
    evidence,
    explanation: buildExplanation(metrics),
    metrics,
    scope,
  })
}

export function hasCriticalExpenseSignal(ruleResults) {
  return ruleResults.some((rule) => rule.severity === INSIGHT_SEVERITY.critical)
}
