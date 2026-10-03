import {
  CASHFLOW_POSITION,
  CASHFLOW_STABILITY,
  COVERAGE_STATUS,
  SPENDING_PACE_STATUS,
} from '../../models/cashflowInsight.js'
import {
  CASHFLOW_RULE_STATUS,
  createCashflowRuleResult,
} from '../../models/cashflowRuleResult.js'
import { INSIGHT_SEVERITY } from '../../utils/insightSeverity.js'
import { CASHFLOW_RULE_IDS } from './cashflowRuleConstants.js'

function noDataResult({ evidence = [], id, message, ruleName, value = null, weight }) {
  return createCashflowRuleResult({
    evidence,
    id,
    message,
    ruleName,
    severity: INSIGHT_SEVERITY.info,
    status: CASHFLOW_RULE_STATUS.noData,
    value,
    weight,
  })
}

export function evaluateRemainingCash(context, weight) {
  const value = context.metrics.remainingCash

  if (!context.currentCutoff) {
    return noDataResult({
      id: CASHFLOW_RULE_IDS.remainingCash,
      message: 'No current cutoff is available for remaining-cash analysis.',
      ruleName: 'Remaining Cash',
      value,
      weight,
    })
  }

  const negative = value < 0
  const balanced = value === 0

  return createCashflowRuleResult({
    evidence: [{ label: 'Remaining Cash', value }],
    id: CASHFLOW_RULE_IDS.remainingCash,
    message: negative
      ? `Remaining cash is negative at ${value}.`
      : balanced
        ? 'Remaining cash is exactly zero.'
        : `Remaining cash is positive at ${value}.`,
    passed: !negative,
    ruleName: 'Remaining Cash',
    score: negative ? 0 : balanced ? 70 : 100,
    severity: negative
      ? INSIGHT_SEVERITY.critical
      : balanced
        ? INSIGHT_SEVERITY.warning
        : INSIGHT_SEVERITY.success,
    status: negative
      ? CASHFLOW_RULE_STATUS.fail
      : balanced
        ? CASHFLOW_RULE_STATUS.warning
        : CASHFLOW_RULE_STATUS.pass,
    value,
    weight,
  })
}

export function evaluateNetCashflow(context, weight) {
  const value = context.metrics.netCashflow

  if (!context.currentCutoff) {
    return noDataResult({
      id: CASHFLOW_RULE_IDS.netCashflow,
      message: 'No current cutoff is available for net-cashflow analysis.',
      ruleName: 'Net Cashflow',
      value,
      weight,
    })
  }

  const negative = value < 0

  return createCashflowRuleResult({
    evidence: [
      { label: 'Net Cashflow Before Savings', value },
      { label: 'Cashflow Position', value: context.metrics.position },
    ],
    id: CASHFLOW_RULE_IDS.netCashflow,
    message: `Net cashflow before savings is ${value}; final cashflow position is ${context.metrics.position.toLowerCase()}.`,
    passed: !negative,
    ruleName: 'Net Cashflow',
    score: negative ? 0 : 100,
    severity: negative ? INSIGHT_SEVERITY.critical : INSIGHT_SEVERITY.success,
    status: negative ? CASHFLOW_RULE_STATUS.fail : CASHFLOW_RULE_STATUS.pass,
    value: {
      amount: value,
      position: context.metrics.position,
    },
    weight,
  })
}

export function evaluateSpendingPace(context, weight) {
  const pace = context.metrics.spendingPace

  if (pace.status === SPENDING_PACE_STATUS.noData) {
    return noDataResult({
      evidence: [
        {
          label: 'Actual Income',
          value: Number(context.cashflow?.actualIncome) || 0,
          description: 'Spending pace requires current-cutoff income.',
        },
      ],
      id: CASHFLOW_RULE_IDS.spendingPace,
      message: 'Spending pace is not available without current-cutoff income.',
      ruleName: 'Spending Pace',
      value: pace,
      weight,
    })
  }

  const fast = pace.status === SPENDING_PACE_STATUS.fast

  return createCashflowRuleResult({
    evidence: [
      { label: 'Daily Spending Rate', value: pace.dailySpendingRate },
      { label: 'Cutoff Elapsed', value: pace.elapsedPercent },
      { label: 'Income Spent', value: pace.spendingPercent },
      { label: 'Pace Delta', value: pace.paceDelta },
    ],
    id: CASHFLOW_RULE_IDS.spendingPace,
    message: `Spending pace is ${pace.status.toLowerCase()}: ${pace.spendingPercent}% of income spent with ${pace.elapsedPercent}% of the cutoff elapsed.`,
    passed: !fast,
    ruleName: 'Spending Pace',
    score: fast ? 55 : pace.status === SPENDING_PACE_STATUS.onPace ? 85 : 100,
    severity: fast
      ? INSIGHT_SEVERITY.warning
      : pace.status === SPENDING_PACE_STATUS.onPace
        ? INSIGHT_SEVERITY.info
        : INSIGHT_SEVERITY.success,
    status: fast ? CASHFLOW_RULE_STATUS.warning : CASHFLOW_RULE_STATUS.pass,
    value: pace,
    weight,
  })
}

export function evaluateIncomeCoverage(context, weight) {
  const coverage = context.metrics.incomeCoverage

  if (coverage.status === COVERAGE_STATUS.noData) {
    return noDataResult({
      id: CASHFLOW_RULE_IDS.incomeCoverage,
      message: 'Income coverage needs current-cutoff financial activity.',
      ruleName: 'Income Coverage',
      value: coverage,
      weight,
    })
  }

  const covered = coverage.status === COVERAGE_STATUS.covered
  const uncovered = coverage.status === COVERAGE_STATUS.uncovered

  return createCashflowRuleResult({
    evidence: [
      { label: 'Actual Income', value: coverage.actualIncome },
      { label: 'Recorded Outflows', value: coverage.requiredOutflows },
      { label: 'Coverage', value: coverage.coveragePercent },
    ],
    id: CASHFLOW_RULE_IDS.incomeCoverage,
    message: `Income covers ${coverage.coveragePercent}% of recorded expenses and savings.`,
    passed: covered,
    ruleName: 'Income Coverage',
    score: covered ? 100 : uncovered ? 0 : 60,
    severity: covered
      ? INSIGHT_SEVERITY.success
      : uncovered
        ? INSIGHT_SEVERITY.critical
        : INSIGHT_SEVERITY.warning,
    status: covered
      ? CASHFLOW_RULE_STATUS.pass
      : uncovered
        ? CASHFLOW_RULE_STATUS.fail
        : CASHFLOW_RULE_STATUS.warning,
    value: coverage,
    weight,
  })
}

export function evaluateSavingsCoverage(context, weight) {
  const coverage = context.metrics.savingsCoverage

  if (coverage.status === COVERAGE_STATUS.noData) {
    return noDataResult({
      evidence: [{ label: 'Savings', value: coverage.totalSavings }],
      id: CASHFLOW_RULE_IDS.savingsCoverage,
      message: 'Savings coverage is not available without current-cutoff savings.',
      ruleName: 'Savings Coverage',
      value: coverage,
      weight,
    })
  }

  const covered = coverage.status === COVERAGE_STATUS.covered
  const uncovered = coverage.status === COVERAGE_STATUS.uncovered

  return createCashflowRuleResult({
    evidence: [
      { label: 'Available After Expenses', value: coverage.availableAfterExpenses },
      { label: 'Savings', value: coverage.totalSavings },
      { label: 'Savings Coverage', value: coverage.coveragePercent },
    ],
    id: CASHFLOW_RULE_IDS.savingsCoverage,
    message: `Cash available after expenses covers ${coverage.coveragePercent}% of recorded savings.`,
    passed: covered,
    ruleName: 'Savings Coverage',
    score: covered ? 100 : uncovered ? 0 : 60,
    severity: covered
      ? INSIGHT_SEVERITY.success
      : uncovered
        ? INSIGHT_SEVERITY.critical
        : INSIGHT_SEVERITY.warning,
    status: covered
      ? CASHFLOW_RULE_STATUS.pass
      : uncovered
        ? CASHFLOW_RULE_STATUS.fail
        : CASHFLOW_RULE_STATUS.warning,
    value: coverage,
    weight,
  })
}

export function evaluateCashflowStability(context, weight) {
  const stability = context.metrics.stability

  if (stability.status === CASHFLOW_STABILITY.noData) {
    return noDataResult({
      id: CASHFLOW_RULE_IDS.cashflowStability,
      message: stability.reason || 'Cashflow stability is not available yet.',
      ruleName: 'Cashflow Stability',
      value: stability,
      weight,
    })
  }

  const stable = stability.status === CASHFLOW_STABILITY.stable
  const unstable = stability.status === CASHFLOW_STABILITY.unstable

  return createCashflowRuleResult({
    evidence: [
      { label: 'Cashflow Position', value: context.metrics.position },
      { label: 'Spending Pace', value: context.metrics.spendingPace.status },
      { label: 'Income Coverage', value: context.metrics.incomeCoverage.status },
    ],
    id: CASHFLOW_RULE_IDS.cashflowStability,
    message: stability.reason,
    passed: stable,
    ruleName: 'Cashflow Stability',
    score: stable ? 100 : unstable ? 0 : 60,
    severity: stable
      ? INSIGHT_SEVERITY.success
      : unstable
        ? INSIGHT_SEVERITY.critical
        : INSIGHT_SEVERITY.warning,
    status: stable
      ? CASHFLOW_RULE_STATUS.pass
      : unstable
        ? CASHFLOW_RULE_STATUS.fail
        : CASHFLOW_RULE_STATUS.warning,
    value: stability,
    weight,
  })
}

export const cashflowRuleInternals = {
  noDataResult,
  CASHFLOW_POSITION,
}
