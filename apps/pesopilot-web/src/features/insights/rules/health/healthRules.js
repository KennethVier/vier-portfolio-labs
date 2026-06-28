import { HEALTH_RULE_STATUS, createHealthRuleResult } from '../../models/healthRuleResult.js'
import { INSIGHT_SEVERITY } from '../../utils/insightSeverity.js'
import { HEALTH_RULE_IDS } from './healthRuleConstants.js'

function noCurrentCutoffResult({ domain, id, ruleName, weight }) {
  return createHealthRuleResult({
    domain,
    evidence: [
      {
        label: 'Current Cutoff',
        value: 'None',
        description: 'No active salary cutoff is available for current-cycle health scoring.',
      },
    ],
    id,
    message: 'Create a current salary cutoff before health scoring can evaluate this rule.',
    ruleName,
    severity: INSIGHT_SEVERITY.info,
    status: HEALTH_RULE_STATUS.noData,
    weight,
  })
}

export function evaluateIncomeAvailability(context, weight) {
  const ruleName = 'Income Availability'

  if (!context.currentCutoff) {
    return noCurrentCutoffResult({
      domain: 'income',
      id: HEALTH_RULE_IDS.incomeAvailability,
      ruleName,
      weight,
    })
  }

  const value = context.income.totalIncome
  const hasIncome = value > 0

  return createHealthRuleResult({
    domain: 'income',
    evidence: [
      {
        label: 'Current-Cutoff Income',
        value,
        description: 'Total income linked to the current salary cutoff.',
      },
    ],
    id: HEALTH_RULE_IDS.incomeAvailability,
    message: hasIncome
      ? 'Current cutoff has recorded income.'
      : 'No income is recorded for the current cutoff.',
    passed: hasIncome,
    ruleName,
    score: hasIncome ? 100 : 0,
    severity: hasIncome ? INSIGHT_SEVERITY.success : INSIGHT_SEVERITY.critical,
    status: hasIncome ? HEALTH_RULE_STATUS.pass : HEALTH_RULE_STATUS.fail,
    value,
    weight,
  })
}

export function evaluateExpenseRatio(context, weight) {
  const ruleName = 'Expense Ratio'

  if (!context.currentCutoff) {
    return noCurrentCutoffResult({
      domain: 'expenses',
      id: HEALTH_RULE_IDS.expenseRatio,
      ruleName,
      weight,
    })
  }

  const value = context.ratios.expenseRate
  let score = 0
  let status = HEALTH_RULE_STATUS.fail
  let severity = INSIGHT_SEVERITY.critical

  if (context.income.totalIncome > 0) {
    if (value <= 50) {
      score = 100
      status = HEALTH_RULE_STATUS.pass
      severity = INSIGHT_SEVERITY.success
    } else if (value <= 70) {
      score = 80
      status = HEALTH_RULE_STATUS.pass
      severity = INSIGHT_SEVERITY.success
    } else if (value <= 90) {
      score = 60
      status = HEALTH_RULE_STATUS.warning
      severity = INSIGHT_SEVERITY.warning
    } else if (value <= 100) {
      score = 40
      status = HEALTH_RULE_STATUS.warning
      severity = INSIGHT_SEVERITY.warning
    }
  }

  return createHealthRuleResult({
    domain: 'expenses',
    evidence: [
      {
        label: 'Expense Rate',
        value,
        description: 'Current-cutoff expenses divided by current-cutoff income.',
      },
      {
        label: 'Current-Cutoff Expenses',
        value: context.expenses.totalExpenses,
      },
    ],
    id: HEALTH_RULE_IDS.expenseRatio,
    message:
      context.income.totalIncome > 0
        ? `Expenses are ${value.toFixed(2)}% of current-cutoff income.`
        : 'Expense ratio needs current-cutoff income before it can be healthy.',
    passed: score >= 80,
    ruleName,
    score,
    severity,
    status,
    value,
    weight,
  })
}

export function evaluateSavingsRatio(context, weight) {
  const ruleName = 'Savings Ratio'

  if (!context.currentCutoff) {
    return noCurrentCutoffResult({
      domain: 'savings',
      id: HEALTH_RULE_IDS.savingsRatio,
      ruleName,
      weight,
    })
  }

  const value = context.ratios.savingsRate
  let score = 0
  let status = HEALTH_RULE_STATUS.fail
  let severity = INSIGHT_SEVERITY.critical

  if (context.income.totalIncome > 0) {
    if (value >= 20) {
      score = 100
      status = HEALTH_RULE_STATUS.pass
      severity = INSIGHT_SEVERITY.success
    } else if (value >= 10) {
      score = 80
      status = HEALTH_RULE_STATUS.pass
      severity = INSIGHT_SEVERITY.success
    } else if (value > 0) {
      score = 50
      status = HEALTH_RULE_STATUS.warning
      severity = INSIGHT_SEVERITY.warning
    }
  }

  return createHealthRuleResult({
    domain: 'savings',
    evidence: [
      {
        label: 'Savings Rate',
        value,
        description: 'Current-cutoff savings divided by current-cutoff income.',
      },
      {
        label: 'Current-Cutoff Savings',
        value: context.savings.totalSavings,
      },
    ],
    id: HEALTH_RULE_IDS.savingsRatio,
    message:
      context.income.totalIncome > 0
        ? `Savings are ${value.toFixed(2)}% of current-cutoff income.`
        : 'Savings ratio needs current-cutoff income before it can be healthy.',
    passed: score >= 80,
    ruleName,
    score,
    severity,
    status,
    value,
    weight,
  })
}

export function evaluateRemainingCash(context, weight) {
  const ruleName = 'Remaining Cash'

  if (!context.currentCutoff) {
    return noCurrentCutoffResult({
      domain: 'cashflow',
      id: HEALTH_RULE_IDS.remainingCash,
      ruleName,
      weight,
    })
  }

  const value = context.cashflow.remainingCash
  const score = value > 0 ? 100 : value === 0 ? 60 : 0
  const status =
    value > 0
      ? HEALTH_RULE_STATUS.pass
      : value === 0
        ? HEALTH_RULE_STATUS.warning
        : HEALTH_RULE_STATUS.fail

  return createHealthRuleResult({
    domain: 'cashflow',
    evidence: [
      {
        label: 'Remaining Cash',
        value,
        description: 'Income minus expenses and savings for the current cutoff.',
      },
    ],
    id: HEALTH_RULE_IDS.remainingCash,
    message:
      value > 0
        ? 'Current cutoff has cash remaining after expenses and savings.'
        : value === 0
          ? 'Current cutoff cash is fully allocated.'
          : 'Current cutoff spending and savings exceed recorded income.',
    passed: value > 0,
    ruleName,
    score,
    severity:
      value > 0
        ? INSIGHT_SEVERITY.success
        : value === 0
          ? INSIGHT_SEVERITY.warning
          : INSIGHT_SEVERITY.critical,
    status,
    value,
    weight,
  })
}

export function evaluateGoalContributionParticipation(context, weight) {
  const ruleName = 'Goal Contribution Participation'

  if (!context.currentCutoff) {
    return noCurrentCutoffResult({
      domain: 'goals',
      id: HEALTH_RULE_IDS.goalContributionParticipation,
      ruleName,
      weight,
    })
  }

  if (context.goals.activeGoalCount === 0) {
    return createHealthRuleResult({
      domain: 'goals',
      evidence: [
        {
          label: 'Active Savings Goals',
          value: 0,
          description: 'No active savings goals exist yet.',
        },
      ],
      id: HEALTH_RULE_IDS.goalContributionParticipation,
      message: 'No active savings goals are available yet. This rule is informational.',
      passed: true,
      ruleName,
      score: 60,
      severity: INSIGHT_SEVERITY.info,
      status: HEALTH_RULE_STATUS.noData,
      value: 0,
      weight,
    })
  }

  const value = context.goals.currentCutoffGoalContributionCount
  const hasGoalContribution = value > 0

  return createHealthRuleResult({
    domain: 'goals',
    evidence: [
      {
        label: 'Current-Cutoff Goal Contributions',
        value,
        description: 'Savings contributions linked to active goals in the current cutoff.',
      },
      {
        label: 'Active Savings Goals',
        value: context.goals.activeGoalCount,
      },
    ],
    id: HEALTH_RULE_IDS.goalContributionParticipation,
    message: hasGoalContribution
      ? 'At least one active savings goal received a current-cutoff contribution.'
      : 'Active savings goals have no current-cutoff contributions yet.',
    passed: hasGoalContribution,
    ruleName,
    score: hasGoalContribution ? 100 : 40,
    severity: hasGoalContribution ? INSIGHT_SEVERITY.success : INSIGHT_SEVERITY.warning,
    status: hasGoalContribution ? HEALTH_RULE_STATUS.pass : HEALTH_RULE_STATUS.warning,
    value,
    weight,
  })
}
