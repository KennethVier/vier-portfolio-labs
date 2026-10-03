import { createCashflowInsight } from '../../models/cashflowInsight.js'

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
  if (metrics.position === 'No Data') {
    return 'No current-cutoff cashflow is available for this scope yet.'
  }

  const paceText =
    metrics.spendingPace.status === 'No Data'
      ? 'Spending pace is not available without recorded income.'
      : `Spending pace is ${metrics.spendingPace.status.toLowerCase()}.`
  const incomeCoverageText =
    metrics.incomeCoverage.status === 'No Data'
      ? 'Income coverage is not available yet.'
      : `Income coverage is ${metrics.incomeCoverage.coveragePercent}%.`
  const savingsCoverageText =
    metrics.savingsCoverage.status === 'No Data'
      ? 'No savings coverage is available for this cutoff.'
      : `Savings coverage is ${metrics.savingsCoverage.coveragePercent}%.`

  return `Remaining cash is ${metrics.remainingCash}, with net cashflow before savings of ${metrics.netCashflow}. ${paceText} ${incomeCoverageText} ${savingsCoverageText} Cashflow stability is ${metrics.stability.status.toLowerCase()}.`
}

export function aggregateCashflowRules({ context, metrics, ruleResults, scope }) {
  const evidence = ruleResults.flatMap((rule) =>
    rule.evidence.map((item) => ({
      ruleId: rule.id,
      ...item,
    })),
  )

  return createCashflowInsight({
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
