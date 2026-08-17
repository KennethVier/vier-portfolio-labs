import { createIncomeInsight } from '../../models/incomeInsight.js'

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
  if (metrics.incomeCount === 0) {
    return 'No income is recorded for this scope yet.'
  }

  const sourceText = metrics.primarySource
    ? `${metrics.primarySource.source} is the primary income source.`
    : 'No primary income source is available.'
  const trendText =
    metrics.trend.direction === 'No Data'
      ? 'A comparison trend is not available yet.'
      : `Income trend is ${metrics.trend.direction.toLowerCase()} versus the previous cutoff.`
  const stabilityText =
    metrics.stability.status === 'No Data'
      ? 'Income stability is not available yet.'
      : `Income stability is ${metrics.stability.status.toLowerCase()}.`

  return `${sourceText} ${trendText} ${stabilityText}`
}

export function aggregateIncomeRules({ context, metrics, ruleResults, scope }) {
  const evidence = ruleResults.flatMap((rule) =>
    rule.evidence.map((item) => ({
      ruleId: rule.id,
      ...item,
    })),
  )

  return createIncomeInsight({
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
