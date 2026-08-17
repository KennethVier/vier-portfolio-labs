import { createSavingsInsight } from '../../models/savingsInsight.js'

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
  if (metrics.savingsCount === 0) {
    return 'No savings are recorded for this scope yet.'
  }

  const rateText =
    metrics.savingsRate.status === 'No Data'
      ? 'Savings rate is not available until income is recorded.'
      : `Savings rate is ${metrics.savingsRate.rate}% of current-cutoff income.`
  const trendText =
    metrics.trend.direction === 'No Data'
      ? 'A savings trend is not available yet.'
      : `Savings trend is ${metrics.trend.direction.toLowerCase()} versus the previous cutoff.`
  const consistencyText =
    metrics.consistency.status === 'No Data'
      ? 'Savings consistency is not available yet.'
      : `Savings consistency is ${metrics.consistency.status.toLowerCase()}.`

  return `${rateText} ${trendText} ${consistencyText}`
}

export function aggregateSavingsRules({ context, metrics, ruleResults, scope }) {
  const evidence = ruleResults.flatMap((rule) =>
    rule.evidence.map((item) => ({
      ruleId: rule.id,
      ...item,
    })),
  )

  return createSavingsInsight({
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
