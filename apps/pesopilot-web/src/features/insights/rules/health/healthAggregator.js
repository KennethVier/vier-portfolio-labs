import { createHealthInsight, HEALTH_STATUS } from '../../models/healthInsight.js'
import { INSIGHT_SEVERITY } from '../../utils/insightSeverity.js'

export function getHealthStatus(score) {
  if (score >= 90) {
    return HEALTH_STATUS.excellent
  }

  if (score >= 75) {
    return HEALTH_STATUS.healthy
  }

  if (score >= 60) {
    return HEALTH_STATUS.fair
  }

  if (score >= 40) {
    return HEALTH_STATUS.needsAttention
  }

  return HEALTH_STATUS.critical
}

function getRuleContribution(rule) {
  return (rule.score * rule.weight) / 100
}

function buildBreakdown(ruleResults) {
  return ruleResults.map((rule) => ({
    id: rule.id,
    label: rule.ruleName,
    score: rule.score,
    weight: rule.weight,
    contribution: getRuleContribution(rule),
    status: rule.status,
    severity: rule.severity,
  }))
}

function buildExplanation(status, score, ruleResults) {
  const strongestRule = [...ruleResults].sort(
    (firstRule, secondRule) => secondRule.score - firstRule.score,
  )[0]
  const weakestRule = [...ruleResults].sort(
    (firstRule, secondRule) => firstRule.score - secondRule.score,
  )[0]

  if (!strongestRule || !weakestRule) {
    return `Financial health is ${status} with a score of ${score}.`
  }

  return `Financial health is ${status} with a score of ${score}. Strongest signal: ${strongestRule.ruleName}. Main watch area: ${weakestRule.ruleName}.`
}

export function aggregateHealthRules({ ruleResults, scope }) {
  const score = Math.round(
    ruleResults.reduce((total, rule) => total + getRuleContribution(rule), 0),
  )
  const status = getHealthStatus(score)
  const strengths = ruleResults
    .filter((rule) => rule.severity === INSIGHT_SEVERITY.success)
    .map((rule) => rule.message)
  const weaknesses = ruleResults
    .filter((rule) =>
      [INSIGHT_SEVERITY.warning, INSIGHT_SEVERITY.critical].includes(
        rule.severity,
      ),
    )
    .map((rule) => rule.message)
  const evidence = ruleResults.flatMap((rule) =>
    rule.evidence.map((item) => ({
      ruleId: rule.id,
      ...item,
    })),
  )

  return createHealthInsight({
    breakdown: buildBreakdown(ruleResults),
    diagnostics: {
      executedRules: ruleResults.map((rule) => rule.id),
      warnings: [],
    },
    evidence,
    explanation: buildExplanation(status, score, ruleResults),
    scope,
    score,
    status,
    strengths,
    weaknesses,
  })
}
