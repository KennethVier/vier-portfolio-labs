import { createCutoffInsight } from '../../models/cutoffInsight.js'

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

function describe(label, comparison) {
  if (comparison.direction === 'No Data') {
    return null
  }

  return `${label} is ${comparison.direction.toLowerCase()} by ${Math.abs(comparison.difference)} (${comparison.percentageChange}%).`
}

function buildExplanation(metrics) {
  if (!metrics.currentCutoff) {
    return 'No current-cutoff data is available for cutoff analysis yet.'
  }

  const parts = [`Current cutoff ${metrics.currentCutoff.cutoffName} has remaining cash of ${metrics.currentCutoff.remainingCash}.`]
  const previous = metrics.previousCutoffComparison

  if (metrics.previousCutoff) {
    parts.push(
      `Versus ${metrics.previousCutoff.cutoffName}:`,
      describe('income', previous.income),
      describe('expenses', previous.expenses),
      describe('savings', previous.savings),
    )
  } else {
    parts.push('No previous cutoff data is available for comparison.')
  }

  const averageText = describe(
    'Remaining cash versus the monthly average',
    metrics.averageComparison.remainingCash,
  )

  parts.push(averageText ?? 'No historical monthly average is available.')

  if (metrics.bestCutoff && metrics.worstCutoff) {
    parts.push(
      `Best cutoff is ${metrics.bestCutoff.cutoffName}; worst cutoff is ${metrics.worstCutoff.cutoffName}.`,
    )
  }

  parts.push(`Cutoff trend is ${metrics.trend.direction.toLowerCase()}.`)

  return parts.filter(Boolean).join(' ')
}

export function aggregateCutoffRules({ context, metrics, ruleResults, scope }) {
  const evidence = ruleResults.flatMap((rule) =>
    rule.evidence.map((item) => ({
      ruleId: rule.id,
      ...item,
    })),
  )

  return createCutoffInsight({
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
