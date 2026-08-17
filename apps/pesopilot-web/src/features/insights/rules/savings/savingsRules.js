import {
  SAVINGS_CONSISTENCY,
  SAVINGS_RATE_STATUS,
  SAVINGS_TREND,
} from '../../models/savingsInsight.js'
import {
  SAVINGS_RULE_STATUS,
  createSavingsRuleResult,
} from '../../models/savingsRuleResult.js'
import { INSIGHT_SEVERITY } from '../../utils/insightSeverity.js'
import { SAVINGS_RULE_IDS } from './savingsRuleConstants.js'

function noDataResult({ evidence = [], id, message, ruleName, value = null, weight }) {
  return createSavingsRuleResult({
    evidence,
    id,
    message,
    ruleName,
    severity: INSIGHT_SEVERITY.info,
    status: SAVINGS_RULE_STATUS.noData,
    value,
    weight,
  })
}

export function evaluateSavingsTotal(context, weight) {
  const totalSavings = context.metrics.totalSavings

  if (!context.currentCutoff) {
    return noDataResult({
      evidence: [
        {
          label: 'Current Cutoff',
          value: 'None',
          description: 'Savings intelligence is current-cutoff first.',
        },
      ],
      id: SAVINGS_RULE_IDS.savingsTotal,
      message: 'No current cutoff is available for savings intelligence.',
      ruleName: 'Savings Total',
      value: totalSavings,
      weight,
    })
  }

  if (!context.metrics.savingsCount) {
    return noDataResult({
      evidence: [
        {
          label: 'Current-Cutoff Savings',
          value: 0,
        },
      ],
      id: SAVINGS_RULE_IDS.savingsTotal,
      message: 'No savings are recorded for the current cutoff.',
      ruleName: 'Savings Total',
      value: totalSavings,
      weight,
    })
  }

  return createSavingsRuleResult({
    evidence: [
      {
        label: 'Total Savings',
        value: totalSavings,
      },
      {
        label: 'Savings Contributions',
        value: context.metrics.savingsCount,
      },
    ],
    id: SAVINGS_RULE_IDS.savingsTotal,
    message: `Total savings for the current cutoff are ${totalSavings}.`,
    passed: true,
    ruleName: 'Savings Total',
    score: 100,
    severity: INSIGHT_SEVERITY.success,
    status: SAVINGS_RULE_STATUS.pass,
    value: totalSavings,
    weight,
  })
}

export function evaluateSavingsRate(context, weight) {
  const savingsRate = context.metrics.savingsRate

  if (savingsRate.status === SAVINGS_RATE_STATUS.noData) {
    return noDataResult({
      evidence: [
        {
          label: 'Current-Cutoff Income',
          value: savingsRate.totalIncome,
          description: 'Savings rate needs income recorded in the current cutoff.',
        },
        {
          label: 'Current-Cutoff Savings',
          value: savingsRate.totalSavings,
        },
      ],
      id: SAVINGS_RULE_IDS.savingsRate,
      message: 'Savings rate is not available without current-cutoff income.',
      ruleName: 'Savings Rate',
      value: savingsRate,
      weight,
    })
  }

  const lowRate = savingsRate.status === SAVINGS_RATE_STATUS.low
  const acceptableRate = savingsRate.status === SAVINGS_RATE_STATUS.acceptable

  return createSavingsRuleResult({
    evidence: [
      {
        label: 'Savings Rate',
        value: savingsRate.rate,
      },
      {
        label: 'Savings',
        value: savingsRate.totalSavings,
      },
      {
        label: 'Income',
        value: savingsRate.totalIncome,
      },
    ],
    id: SAVINGS_RULE_IDS.savingsRate,
    message: `Savings rate is ${savingsRate.rate}% for the current cutoff.`,
    passed: !lowRate,
    ruleName: 'Savings Rate',
    score: lowRate ? 50 : acceptableRate ? 80 : 100,
    severity: lowRate
      ? INSIGHT_SEVERITY.warning
      : acceptableRate
        ? INSIGHT_SEVERITY.info
        : INSIGHT_SEVERITY.success,
    status: lowRate ? SAVINGS_RULE_STATUS.warning : SAVINGS_RULE_STATUS.pass,
    value: savingsRate,
    weight,
  })
}

export function evaluateSavingsTrend(context, weight) {
  const trend = context.metrics.trend

  if (trend.direction === SAVINGS_TREND.noData) {
    return noDataResult({
      evidence: [
        {
          label: 'Previous Cutoff',
          value: context.previousCutoff?.name ?? 'None',
        },
      ],
      id: SAVINGS_RULE_IDS.savingsTrend,
      message: 'Savings trend needs a previous cutoff with savings.',
      ruleName: 'Savings Trend',
      value: trend,
      weight,
    })
  }

  const decreasing = trend.direction === SAVINGS_TREND.decreasing

  return createSavingsRuleResult({
    evidence: [
      {
        label: 'Current Savings',
        value: trend.currentTotal,
      },
      {
        label: 'Comparison Savings',
        value: trend.comparisonTotal,
      },
      {
        label: 'Change',
        value: trend.percentageChange,
      },
    ],
    id: SAVINGS_RULE_IDS.savingsTrend,
    message: `Savings trend is ${trend.direction.toLowerCase()} at ${trend.percentageChange}%.`,
    passed: !decreasing,
    ruleName: 'Savings Trend',
    score: decreasing ? 60 : 100,
    severity: decreasing ? INSIGHT_SEVERITY.warning : INSIGHT_SEVERITY.success,
    status: decreasing ? SAVINGS_RULE_STATUS.warning : SAVINGS_RULE_STATUS.pass,
    value: trend,
    weight,
  })
}

export function evaluatePreviousCutoffComparison(context, weight) {
  const comparison = context.metrics.previousCutoffComparison

  if (comparison.direction === SAVINGS_TREND.noData) {
    return noDataResult({
      evidence: [
        {
          label: 'Previous Cutoff',
          value: context.previousCutoff?.name ?? 'None',
        },
      ],
      id: SAVINGS_RULE_IDS.previousCutoffComparison,
      message: 'Previous cutoff comparison needs a previous cutoff with savings.',
      ruleName: 'Previous Cutoff Comparison',
      value: comparison,
      weight,
    })
  }

  const decreasing = comparison.direction === SAVINGS_TREND.decreasing

  return createSavingsRuleResult({
    evidence: [
      {
        label: 'Current Savings',
        value: comparison.currentTotal,
      },
      {
        label: 'Previous Savings',
        value: comparison.comparisonTotal,
      },
      {
        label: 'Change',
        value: comparison.percentageChange,
      },
    ],
    id: SAVINGS_RULE_IDS.previousCutoffComparison,
    message: `Savings are ${comparison.direction.toLowerCase()} by ${comparison.percentageChange}% versus the previous cutoff.`,
    passed: !decreasing,
    ruleName: 'Previous Cutoff Comparison',
    score: decreasing ? 60 : 100,
    severity: decreasing ? INSIGHT_SEVERITY.warning : INSIGHT_SEVERITY.success,
    status: decreasing ? SAVINGS_RULE_STATUS.warning : SAVINGS_RULE_STATUS.pass,
    value: comparison,
    weight,
  })
}

export function evaluateContributionFrequency(context, weight) {
  const frequency = context.metrics.contributionFrequency

  if (!context.currentCutoff || frequency.contributionCount === 0) {
    return noDataResult({
      evidence: [
        {
          label: 'Contributions',
          value: frequency.contributionCount,
        },
      ],
      id: SAVINGS_RULE_IDS.contributionFrequency,
      message: 'Contribution frequency is not available without savings contributions.',
      ruleName: 'Contribution Frequency',
      value: frequency,
      weight,
    })
  }

  return createSavingsRuleResult({
    evidence: [
      {
        label: 'Contributions',
        value: frequency.contributionCount,
      },
      {
        label: 'Active Contribution Days',
        value: frequency.activeContributionDays,
      },
      {
        label: 'Contributions Per Week',
        value: frequency.contributionsPerWeek,
      },
    ],
    id: SAVINGS_RULE_IDS.contributionFrequency,
    message: `Savings contributions are averaging ${frequency.contributionsPerWeek} per week.`,
    passed: true,
    ruleName: 'Contribution Frequency',
    score: 100,
    severity: INSIGHT_SEVERITY.info,
    status: SAVINGS_RULE_STATUS.pass,
    value: frequency,
    weight,
  })
}

export function evaluateLargestSavingsContribution(context, weight) {
  const largestSavingsContribution = context.metrics.largestSavingsContribution

  if (!largestSavingsContribution) {
    return noDataResult({
      id: SAVINGS_RULE_IDS.largestSavingsContribution,
      message: 'Largest savings contribution is not available yet.',
      ruleName: 'Largest Savings Contribution',
      value: null,
      weight,
    })
  }

  return createSavingsRuleResult({
    evidence: [
      {
        label: 'Largest Contribution',
        value: largestSavingsContribution.amount,
        description: largestSavingsContribution.source,
      },
      {
        label: 'Contribution Date',
        value: largestSavingsContribution.date,
      },
    ],
    id: SAVINGS_RULE_IDS.largestSavingsContribution,
    message: `Largest savings contribution is ${largestSavingsContribution.amount}.`,
    passed: true,
    ruleName: 'Largest Savings Contribution',
    score: 100,
    severity: INSIGHT_SEVERITY.info,
    status: SAVINGS_RULE_STATUS.pass,
    value: largestSavingsContribution,
    weight,
  })
}

export function evaluateSavingsConsistency(context, weight) {
  const consistency = context.metrics.consistency

  if (consistency.status === SAVINGS_CONSISTENCY.noData) {
    return noDataResult({
      id: SAVINGS_RULE_IDS.savingsConsistency,
      message: 'Savings consistency is not available without savings contributions.',
      ruleName: 'Savings Consistency',
      value: consistency,
      weight,
    })
  }

  if (consistency.status === SAVINGS_CONSISTENCY.insufficientHistory) {
    return noDataResult({
      evidence: [
        {
          label: 'Contributions',
          value: consistency.contributionCount,
        },
      ],
      id: SAVINGS_RULE_IDS.savingsConsistency,
      message: 'Savings consistency needs a previous cutoff for comparison.',
      ruleName: 'Savings Consistency',
      value: consistency,
      weight,
    })
  }

  const inconsistent = consistency.status === SAVINGS_CONSISTENCY.inconsistent
  const moderate = consistency.status === SAVINGS_CONSISTENCY.moderate

  return createSavingsRuleResult({
    evidence: [
      {
        label: 'Consistency',
        value: consistency.status,
      },
      {
        label: 'Variance',
        value: consistency.variancePercent,
      },
      {
        label: 'Contribution Days',
        value: consistency.contributionDays,
      },
    ],
    id: SAVINGS_RULE_IDS.savingsConsistency,
    message: `Savings consistency is ${consistency.status.toLowerCase()}.`,
    passed: !inconsistent,
    ruleName: 'Savings Consistency',
    score: inconsistent ? 45 : moderate ? 75 : 100,
    severity: inconsistent
      ? INSIGHT_SEVERITY.warning
      : moderate
        ? INSIGHT_SEVERITY.info
        : INSIGHT_SEVERITY.success,
    status: inconsistent ? SAVINGS_RULE_STATUS.warning : SAVINGS_RULE_STATUS.pass,
    value: consistency,
    weight,
  })
}
