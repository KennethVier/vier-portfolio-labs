import { CUTOFF_TREND } from '../../models/cutoffInsight.js'
import {
  CUTOFF_RULE_STATUS,
  createCutoffRuleResult,
} from '../../models/cutoffRuleResult.js'
import { INSIGHT_SEVERITY } from '../../utils/insightSeverity.js'
import { CUTOFF_RULE_IDS } from './cutoffRuleConstants.js'

function noDataResult({ evidence = [], id, message, ruleName, value = null, weight }) {
  return createCutoffRuleResult({
    evidence,
    id,
    message,
    ruleName,
    severity: INSIGHT_SEVERITY.info,
    status: CUTOFF_RULE_STATUS.noData,
    value,
    weight,
  })
}

// `goodDirection` is the direction that is favorable for the metric
// (e.g. rising income is good, rising expenses are not).
function createComparisonRule({ field, goodDirection, id, label, source }) {
  return function evaluateComparison(context, weight) {
    const comparison = source(context.metrics)[field]

    if (comparison.direction === CUTOFF_TREND.noData) {
      return noDataResult({
        id,
        message: `${label} comparison needs current and comparison cutoff data.`,
        ruleName: `${label} Comparison`,
        value: comparison,
        weight,
      })
    }

    const stable = comparison.direction === CUTOFF_TREND.stable
    const favorable = comparison.direction === goodDirection
    const unfavorable = !stable && !favorable

    return createCutoffRuleResult({
      evidence: [
        { label: `Current ${label}`, value: comparison.currentTotal },
        { label: `Comparison ${label}`, value: comparison.comparisonTotal },
        { label: 'Difference', value: comparison.difference },
        { label: 'Change', value: comparison.percentageChange },
      ],
      id,
      message: `${label} is ${comparison.direction.toLowerCase()} (${comparison.difference >= 0 ? '+' : ''}${comparison.difference}, ${comparison.percentageChange}%).`,
      passed: !unfavorable,
      ruleName: `${label} Comparison`,
      score: unfavorable ? 40 : stable ? 80 : 100,
      severity: unfavorable
        ? INSIGHT_SEVERITY.warning
        : stable
          ? INSIGHT_SEVERITY.info
          : INSIGHT_SEVERITY.success,
      status: unfavorable ? CUTOFF_RULE_STATUS.warning : CUTOFF_RULE_STATUS.pass,
      value: comparison,
      weight,
    })
  }
}

const previous = (metrics) => metrics.previousCutoffComparison
const average = (metrics) => metrics.averageComparison

export const evaluateIncomeComparison = createComparisonRule({
  field: 'income',
  goodDirection: CUTOFF_TREND.increasing,
  id: CUTOFF_RULE_IDS.incomeComparison,
  label: 'Income',
  source: previous,
})

export const evaluateExpenseComparison = createComparisonRule({
  field: 'expenses',
  goodDirection: CUTOFF_TREND.decreasing,
  id: CUTOFF_RULE_IDS.expenseComparison,
  label: 'Expenses',
  source: previous,
})

export const evaluateSavingsComparison = createComparisonRule({
  field: 'savings',
  goodDirection: CUTOFF_TREND.increasing,
  id: CUTOFF_RULE_IDS.savingsComparison,
  label: 'Savings',
  source: previous,
})

export const evaluatePreviousCutoffComparison = createComparisonRule({
  field: 'remainingCash',
  goodDirection: CUTOFF_TREND.increasing,
  id: CUTOFF_RULE_IDS.previousCutoffComparison,
  label: 'Remaining Cash vs Previous Cutoff',
  source: previous,
})

export const evaluateAverageComparison = createComparisonRule({
  field: 'remainingCash',
  goodDirection: CUTOFF_TREND.increasing,
  id: CUTOFF_RULE_IDS.averageComparison,
  label: 'Remaining Cash vs Monthly Average',
  source: average,
})

export function evaluateBestWorstCutoff(context, weight) {
  const { bestCutoff, worstCutoff, currentCutoff } = context.metrics

  if (!bestCutoff || !worstCutoff || bestCutoff.cutoffId === worstCutoff.cutoffId) {
    return noDataResult({
      id: CUTOFF_RULE_IDS.bestWorstCutoff,
      message: 'Best and worst cutoffs need at least two cutoffs with recorded data.',
      ruleName: 'Best/Worst Cutoff',
      weight,
    })
  }

  const currentIsWorst = currentCutoff?.cutoffId === worstCutoff.cutoffId
  const currentIsBest = currentCutoff?.cutoffId === bestCutoff.cutoffId

  return createCutoffRuleResult({
    evidence: [
      { label: 'Best Cutoff', value: bestCutoff.cutoffName },
      { label: 'Best Remaining Cash', value: bestCutoff.remainingCash },
      { label: 'Worst Cutoff', value: worstCutoff.cutoffName },
      { label: 'Worst Remaining Cash', value: worstCutoff.remainingCash },
    ],
    id: CUTOFF_RULE_IDS.bestWorstCutoff,
    message: `Best cutoff is ${bestCutoff.cutoffName} and worst cutoff is ${worstCutoff.cutoffName} by remaining cash.`,
    passed: !currentIsWorst,
    ruleName: 'Best/Worst Cutoff',
    score: currentIsWorst ? 40 : currentIsBest ? 100 : 80,
    severity: currentIsWorst
      ? INSIGHT_SEVERITY.warning
      : currentIsBest
        ? INSIGHT_SEVERITY.success
        : INSIGHT_SEVERITY.info,
    status: currentIsWorst ? CUTOFF_RULE_STATUS.warning : CUTOFF_RULE_STATUS.pass,
    value: { best: bestCutoff, worst: worstCutoff },
    weight,
  })
}

export function evaluateCutoffTrend(context, weight) {
  const { trend } = context.metrics

  if (trend.direction === CUTOFF_TREND.noData) {
    return noDataResult({
      id: CUTOFF_RULE_IDS.cutoffTrend,
      message: 'Cutoff trend needs the current cutoff plus at least two prior cutoffs with recorded data.',
      ruleName: 'Cutoff Trend',
      value: trend,
      weight,
    })
  }

  const decreasing = trend.direction === CUTOFF_TREND.decreasing

  return createCutoffRuleResult({
    evidence: [
      { label: 'Trend Direction', value: trend.direction },
      { label: 'Cutoffs Compared', value: trend.cutoffsCompared },
    ],
    id: CUTOFF_RULE_IDS.cutoffTrend,
    message: `Remaining cash trend is ${trend.direction.toLowerCase()} versus the historical cutoff average.`,
    passed: !decreasing,
    ruleName: 'Cutoff Trend',
    score: decreasing ? 40 : trend.direction === CUTOFF_TREND.stable ? 80 : 100,
    severity: decreasing
      ? INSIGHT_SEVERITY.warning
      : trend.direction === CUTOFF_TREND.stable
        ? INSIGHT_SEVERITY.info
        : INSIGHT_SEVERITY.success,
    status: decreasing ? CUTOFF_RULE_STATUS.warning : CUTOFF_RULE_STATUS.pass,
    value: trend,
    weight,
  })
}
