import {
  INCOME_RULE_STATUS,
  createIncomeRuleResult,
} from '../../models/incomeRuleResult.js'
import { INCOME_STABILITY, INCOME_TREND } from '../../models/incomeInsight.js'
import { INSIGHT_SEVERITY } from '../../utils/insightSeverity.js'
import { INCOME_RULE_IDS } from './incomeRuleConstants.js'

function noDataResult({ evidence = [], id, message, ruleName, value = null, weight }) {
  return createIncomeRuleResult({
    evidence,
    id,
    message,
    ruleName,
    severity: INSIGHT_SEVERITY.info,
    status: INCOME_RULE_STATUS.noData,
    value,
    weight,
  })
}

export function evaluateTotalIncome(context, weight) {
  const totalIncome = context.metrics.totalIncome

  if (!context.currentCutoff) {
    return noDataResult({
      evidence: [
        {
          label: 'Current Cutoff',
          value: 'None',
          description: 'Income intelligence is current-cutoff first.',
        },
      ],
      id: INCOME_RULE_IDS.totalIncome,
      message: 'No current cutoff is available for income intelligence.',
      ruleName: 'Total Income',
      value: totalIncome,
      weight,
    })
  }

  if (!context.metrics.incomeCount) {
    return noDataResult({
      evidence: [
        {
          label: 'Current-Cutoff Income',
          value: 0,
        },
      ],
      id: INCOME_RULE_IDS.totalIncome,
      message: 'No income is recorded for the current cutoff.',
      ruleName: 'Total Income',
      value: totalIncome,
      weight,
    })
  }

  return createIncomeRuleResult({
    evidence: [
      {
        label: 'Total Income',
        value: totalIncome,
      },
      {
        label: 'Income Records',
        value: context.metrics.incomeCount,
      },
    ],
    id: INCOME_RULE_IDS.totalIncome,
    message: `Total income for the current cutoff is ${totalIncome}.`,
    passed: true,
    ruleName: 'Total Income',
    score: 100,
    severity: INSIGHT_SEVERITY.success,
    status: INCOME_RULE_STATUS.pass,
    value: totalIncome,
    weight,
  })
}

export function evaluateIncomeSourceBreakdown(context, weight) {
  const breakdown = context.metrics.sourceBreakdown

  if (breakdown.length === 0) {
    return noDataResult({
      id: INCOME_RULE_IDS.incomeSourceBreakdown,
      message: 'No income source breakdown is available yet.',
      ruleName: 'Income Source Breakdown',
      value: [],
      weight,
    })
  }

  return createIncomeRuleResult({
    evidence: breakdown.map((source) => ({
      label: source.source,
      value: source.amount,
      description: `${source.percentage}% of current-cutoff income.`,
    })),
    id: INCOME_RULE_IDS.incomeSourceBreakdown,
    message: `Income is distributed across ${breakdown.length} sources.`,
    passed: true,
    ruleName: 'Income Source Breakdown',
    score: 100,
    severity: INSIGHT_SEVERITY.info,
    status: INCOME_RULE_STATUS.pass,
    value: breakdown,
    weight,
  })
}

export function evaluatePreviousCutoffComparison(context, weight) {
  const comparison = context.metrics.previousCutoffComparison

  if (comparison.direction === INCOME_TREND.noData) {
    return noDataResult({
      evidence: [
        {
          label: 'Previous Cutoff',
          value: context.previousCutoff?.name ?? 'None',
        },
      ],
      id: INCOME_RULE_IDS.previousCutoffComparison,
      message: 'Previous cutoff comparison needs a previous cutoff with income.',
      ruleName: 'Previous Cutoff Comparison',
      value: comparison,
      weight,
    })
  }

  const decreased = comparison.direction === INCOME_TREND.decreasing

  return createIncomeRuleResult({
    evidence: [
      {
        label: 'Current Income',
        value: comparison.currentTotal,
      },
      {
        label: 'Previous Income',
        value: comparison.comparisonTotal,
      },
      {
        label: 'Change',
        value: comparison.percentageChange,
      },
    ],
    id: INCOME_RULE_IDS.previousCutoffComparison,
    message: `Income is ${comparison.direction.toLowerCase()} by ${comparison.percentageChange}% versus the previous cutoff.`,
    passed: !decreased,
    ruleName: 'Previous Cutoff Comparison',
    score: decreased ? 60 : 100,
    severity: decreased ? INSIGHT_SEVERITY.warning : INSIGHT_SEVERITY.success,
    status: decreased ? INCOME_RULE_STATUS.warning : INCOME_RULE_STATUS.pass,
    value: comparison,
    weight,
  })
}

export function evaluateMonthlyComparison(context, weight) {
  const comparison = context.metrics.monthlyComparison

  if (comparison.direction === INCOME_TREND.noData) {
    return noDataResult({
      evidence: [
        {
          label: 'Previous Month',
          value: comparison.previousMonth ?? 'None',
        },
      ],
      id: INCOME_RULE_IDS.monthlyComparison,
      message: 'Monthly comparison needs income from the previous calendar month.',
      ruleName: 'Monthly Comparison',
      value: comparison,
      weight,
    })
  }

  const decreased = comparison.direction === INCOME_TREND.decreasing

  return createIncomeRuleResult({
    evidence: [
      {
        label: 'Current Month',
        value: comparison.currentMonth,
        description: `${comparison.currentTotal} income recorded.`,
      },
      {
        label: 'Previous Month',
        value: comparison.previousMonth,
        description: `${comparison.previousTotal} income recorded.`,
      },
      {
        label: 'Change',
        value: comparison.percentageChange,
      },
    ],
    id: INCOME_RULE_IDS.monthlyComparison,
    message: `Monthly income is ${comparison.direction.toLowerCase()} by ${comparison.percentageChange}%.`,
    passed: !decreased,
    ruleName: 'Monthly Comparison',
    score: decreased ? 60 : 100,
    severity: decreased ? INSIGHT_SEVERITY.warning : INSIGHT_SEVERITY.success,
    status: decreased ? INCOME_RULE_STATUS.warning : INCOME_RULE_STATUS.pass,
    value: comparison,
    weight,
  })
}

export function evaluateIncomeTrend(context, weight) {
  const trend = context.metrics.trend

  if (trend.direction === INCOME_TREND.noData) {
    return noDataResult({
      evidence: [
        {
          label: 'Previous Cutoff',
          value: context.previousCutoff?.name ?? 'None',
        },
      ],
      id: INCOME_RULE_IDS.incomeTrend,
      message: 'Income trend needs a previous cutoff with income.',
      ruleName: 'Income Trend',
      value: trend,
      weight,
    })
  }

  const decreased = trend.direction === INCOME_TREND.decreasing

  return createIncomeRuleResult({
    evidence: [
      {
        label: 'Current Income',
        value: trend.currentTotal,
      },
      {
        label: 'Comparison Income',
        value: trend.comparisonTotal,
      },
      {
        label: 'Change',
        value: trend.percentageChange,
      },
    ],
    id: INCOME_RULE_IDS.incomeTrend,
    message: `Income trend is ${trend.direction.toLowerCase()} at ${trend.percentageChange}%.`,
    passed: !decreased,
    ruleName: 'Income Trend',
    score: decreased ? 60 : 100,
    severity: decreased ? INSIGHT_SEVERITY.warning : INSIGHT_SEVERITY.success,
    status: decreased ? INCOME_RULE_STATUS.warning : INCOME_RULE_STATUS.pass,
    value: trend,
    weight,
  })
}

export function evaluateMissingIncomeDetection(context, weight) {
  const missingIncome = context.metrics.missingIncome

  if (!context.currentCutoff) {
    return noDataResult({
      evidence: [
        {
          label: 'Current Cutoff',
          value: 'None',
        },
      ],
      id: INCOME_RULE_IDS.missingIncomeDetection,
      message: 'Missing income detection needs a current cutoff.',
      ruleName: 'Missing Income Detection',
      value: missingIncome,
      weight,
    })
  }

  if (!missingIncome.missing) {
    return createIncomeRuleResult({
      evidence: [
        {
          label: 'Actual Income',
          value: missingIncome.actualIncome,
        },
        {
          label: 'Expected Income',
          value: missingIncome.expectedIncome,
        },
        {
          label: 'Gap',
          value: missingIncome.gap,
        },
      ],
      id: INCOME_RULE_IDS.missingIncomeDetection,
      message: missingIncome.reason,
      passed: true,
      ruleName: 'Missing Income Detection',
      score: 100,
      severity: INSIGHT_SEVERITY.success,
      status: INCOME_RULE_STATUS.pass,
      value: missingIncome,
      weight,
    })
  }

  const hasExpectedIncome = missingIncome.expectedIncome > 0

  return createIncomeRuleResult({
    evidence: [
      {
        label: 'Actual Income',
        value: missingIncome.actualIncome,
      },
      {
        label: 'Expected Income',
        value: missingIncome.expectedIncome,
      },
      {
        label: 'Gap',
        value: missingIncome.gap,
      },
    ],
    id: INCOME_RULE_IDS.missingIncomeDetection,
    message: missingIncome.reason,
    passed: false,
    ruleName: 'Missing Income Detection',
    score: hasExpectedIncome ? 0 : 40,
    severity: hasExpectedIncome ? INSIGHT_SEVERITY.critical : INSIGHT_SEVERITY.warning,
    status: INCOME_RULE_STATUS.warning,
    value: missingIncome,
    weight,
  })
}

export function evaluateIncomeStability(context, weight) {
  const stability = context.metrics.stability

  if (stability.status === INCOME_STABILITY.noData) {
    return noDataResult({
      id: INCOME_RULE_IDS.incomeStability,
      message: 'Income stability is not available without current-cutoff income.',
      ruleName: 'Income Stability',
      value: stability,
      weight,
    })
  }

  if (stability.status === INCOME_STABILITY.insufficientHistory) {
    return noDataResult({
      evidence: [
        {
          label: 'Income Records',
          value: stability.recordCount,
        },
      ],
      id: INCOME_RULE_IDS.incomeStability,
      message: 'Income stability needs a previous cutoff for comparison.',
      ruleName: 'Income Stability',
      value: stability,
      weight,
    })
  }

  const unstable = stability.status === INCOME_STABILITY.unstable
  const moderate = stability.status === INCOME_STABILITY.moderate

  return createIncomeRuleResult({
    evidence: [
      {
        label: 'Stability',
        value: stability.status,
      },
      {
        label: 'Variance',
        value: stability.variancePercent,
      },
      {
        label: 'Primary Source Share',
        value: stability.primarySourceShare,
      },
    ],
    id: INCOME_RULE_IDS.incomeStability,
    message: `Income stability is ${stability.status.toLowerCase()}.`,
    passed: !unstable,
    ruleName: 'Income Stability',
    score: unstable ? 40 : moderate ? 75 : 100,
    severity: unstable
      ? INSIGHT_SEVERITY.warning
      : moderate
        ? INSIGHT_SEVERITY.info
        : INSIGHT_SEVERITY.success,
    status: unstable ? INCOME_RULE_STATUS.warning : INCOME_RULE_STATUS.pass,
    value: stability,
    weight,
  })
}
