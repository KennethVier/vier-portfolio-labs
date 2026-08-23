import { createGoalInsight } from '../../models/goalInsight.js'

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
  if (metrics.totalGoals === 0) {
    return 'No savings goals are available for this scope yet.'
  }

  const progressText = `Overall goal completion is ${metrics.overallCompletionRate}%.`
  const fundedText = metrics.highestFundedGoal
    ? `${metrics.highestFundedGoal.name} is the highest funded active goal.`
    : 'No active funded goal is available yet.'
  const unfundedText = metrics.goalsWithoutContributions.length
    ? `${metrics.goalsWithoutContributions.length} goals have no linked contributions.`
    : 'All savings goals have linked contributions.'

  return `${progressText} ${fundedText} ${unfundedText}`
}

export function aggregateGoalRules({ context, metrics, ruleResults, scope }) {
  const evidence = ruleResults.flatMap((rule) =>
    rule.evidence.map((item) => ({
      ruleId: rule.id,
      ...item,
    })),
  )

  return createGoalInsight({
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
