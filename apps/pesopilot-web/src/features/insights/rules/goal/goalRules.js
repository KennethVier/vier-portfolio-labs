import { GOAL_CONSISTENCY } from '../../models/goalInsight.js'
import {
  GOAL_RULE_STATUS,
  createGoalRuleResult,
} from '../../models/goalRuleResult.js'
import { INSIGHT_SEVERITY } from '../../utils/insightSeverity.js'
import { GOAL_RULE_IDS } from './goalRuleConstants.js'

function noDataResult({ evidence = [], id, message, ruleName, value = null, weight }) {
  return createGoalRuleResult({
    evidence,
    id,
    message,
    ruleName,
    severity: INSIGHT_SEVERITY.info,
    status: GOAL_RULE_STATUS.noData,
    value,
    weight,
  })
}

export function evaluateGoalAggregation(context, weight) {
  const metrics = context.metrics

  if (metrics.totalGoals === 0) {
    return noDataResult({
      evidence: [
        {
          label: 'Savings Goals',
          value: 0,
        },
      ],
      id: GOAL_RULE_IDS.goalAggregation,
      message: 'No savings goals are available for goal intelligence.',
      ruleName: 'Goal Aggregation',
      value: metrics.totalGoals,
      weight,
    })
  }

  return createGoalRuleResult({
    evidence: [
      {
        label: 'Total Goals',
        value: metrics.totalGoals,
      },
      {
        label: 'Active Goals',
        value: metrics.activeGoals,
      },
      {
        label: 'Total Target Amount',
        value: metrics.totalTargetAmount,
      },
      {
        label: 'Total Saved Amount',
        value: metrics.totalSavedAmount,
      },
    ],
    id: GOAL_RULE_IDS.goalAggregation,
    message: `${metrics.totalGoals} savings goals are available for analysis.`,
    passed: true,
    ruleName: 'Goal Aggregation',
    score: 100,
    severity: INSIGHT_SEVERITY.success,
    status: GOAL_RULE_STATUS.pass,
    value: metrics.totalGoals,
    weight,
  })
}

export function evaluateGoalProgress(context, weight) {
  const metrics = context.metrics

  if (metrics.totalGoals === 0) {
    return noDataResult({
      id: GOAL_RULE_IDS.goalProgress,
      message: 'Goal progress is not available without savings goals.',
      ruleName: 'Goal Progress',
      value: metrics.overallCompletionRate,
      weight,
    })
  }

  return createGoalRuleResult({
    evidence: [
      {
        label: 'Overall Completion Rate',
        value: metrics.overallCompletionRate,
      },
      {
        label: 'Goals With Targets',
        value: metrics.goals.filter((goal) => goal.targetAmount > 0).length,
      },
    ],
    id: GOAL_RULE_IDS.goalProgress,
    message: `Overall goal progress is ${metrics.overallCompletionRate}%.`,
    passed: true,
    ruleName: 'Goal Progress',
    score: metrics.overallCompletionRate,
    severity: INSIGHT_SEVERITY.info,
    status: GOAL_RULE_STATUS.pass,
    value: metrics.overallCompletionRate,
    weight,
  })
}

export function evaluateGoalCompletion(context, weight) {
  const metrics = context.metrics

  if (metrics.totalGoals === 0) {
    return noDataResult({
      id: GOAL_RULE_IDS.goalCompletion,
      message: 'Goal completion is not available without savings goals.',
      ruleName: 'Goal Completion',
      value: metrics.completedGoals,
      weight,
    })
  }

  return createGoalRuleResult({
    evidence: [
      {
        label: 'Completed Goals',
        value: metrics.completedGoals,
      },
      {
        label: 'Total Goals',
        value: metrics.totalGoals,
      },
    ],
    id: GOAL_RULE_IDS.goalCompletion,
    message: `${metrics.completedGoals} goals are fully funded.`,
    passed: true,
    ruleName: 'Goal Completion',
    score: metrics.completedGoals > 0 ? 100 : 70,
    severity: metrics.completedGoals > 0 ? INSIGHT_SEVERITY.success : INSIGHT_SEVERITY.info,
    status: GOAL_RULE_STATUS.pass,
    value: metrics.completedGoals,
    weight,
  })
}

export function evaluateRemainingAmount(context, weight) {
  const remainingAmount = context.metrics.goals.reduce(
    (total, goal) => total + goal.remainingAmount,
    0,
  )

  if (context.metrics.totalGoals === 0) {
    return noDataResult({
      id: GOAL_RULE_IDS.remainingAmount,
      message: 'Remaining goal amount is not available without savings goals.',
      ruleName: 'Remaining Amount',
      value: 0,
      weight,
    })
  }

  return createGoalRuleResult({
    evidence: [
      {
        label: 'Remaining Amount',
        value: remainingAmount,
      },
      {
        label: 'Target Amount',
        value: context.metrics.totalTargetAmount,
      },
    ],
    id: GOAL_RULE_IDS.remainingAmount,
    message: `Remaining goal amount is ${remainingAmount}.`,
    passed: true,
    ruleName: 'Remaining Amount',
    score: 100,
    severity: INSIGHT_SEVERITY.info,
    status: GOAL_RULE_STATUS.pass,
    value: remainingAmount,
    weight,
  })
}

export function evaluateHighestFundedGoal(context, weight) {
  const highestFundedGoal = context.metrics.highestFundedGoal

  if (!highestFundedGoal) {
    return noDataResult({
      id: GOAL_RULE_IDS.highestFundedGoal,
      message: 'Highest funded goal is not available yet.',
      ruleName: 'Highest Funded Goal',
      value: null,
      weight,
    })
  }

  return createGoalRuleResult({
    evidence: [
      {
        label: 'Goal',
        value: highestFundedGoal.name,
      },
      {
        label: 'Completion',
        value: highestFundedGoal.progress,
      },
      {
        label: 'Saved Amount',
        value: highestFundedGoal.savedAmount,
      },
    ],
    id: GOAL_RULE_IDS.highestFundedGoal,
    message: `${highestFundedGoal.name} is the highest funded active goal at ${highestFundedGoal.progress}%.`,
    passed: true,
    ruleName: 'Highest Funded Goal',
    score: 100,
    severity: INSIGHT_SEVERITY.success,
    status: GOAL_RULE_STATUS.pass,
    value: highestFundedGoal,
    weight,
  })
}

export function evaluateGoalsWithoutContributions(context, weight) {
  const goalsWithoutContributions = context.metrics.goalsWithoutContributions

  if (context.metrics.totalGoals === 0) {
    return noDataResult({
      id: GOAL_RULE_IDS.goalsWithoutContributions,
      message: 'Goals without contributions are not available without savings goals.',
      ruleName: 'Goals Without Contributions',
      value: [],
      weight,
    })
  }

  const hasUnfundedGoals = goalsWithoutContributions.length > 0

  return createGoalRuleResult({
    evidence: [
      {
        label: 'Goals Without Contributions',
        value: goalsWithoutContributions.length,
      },
    ],
    id: GOAL_RULE_IDS.goalsWithoutContributions,
    message: hasUnfundedGoals
      ? `${goalsWithoutContributions.length} goals have no linked contributions.`
      : 'All savings goals have linked contributions.',
    passed: !hasUnfundedGoals,
    ruleName: 'Goals Without Contributions',
    score: hasUnfundedGoals ? 60 : 100,
    severity: hasUnfundedGoals ? INSIGHT_SEVERITY.warning : INSIGHT_SEVERITY.success,
    status: hasUnfundedGoals ? GOAL_RULE_STATUS.warning : GOAL_RULE_STATUS.pass,
    value: goalsWithoutContributions,
    weight,
  })
}

export function evaluateContributionConsistency(context, weight) {
  const consistencyCounts = context.metrics.goals.reduce((counts, goal) => {
    counts[goal.contributionConsistency.status] =
      (counts[goal.contributionConsistency.status] ?? 0) + 1
    return counts
  }, {})

  if (context.metrics.totalGoals === 0) {
    return noDataResult({
      id: GOAL_RULE_IDS.contributionConsistency,
      message: 'Contribution consistency is not available without savings goals.',
      ruleName: 'Contribution Consistency',
      value: consistencyCounts,
      weight,
    })
  }

  const inconsistentCount = consistencyCounts[GOAL_CONSISTENCY.inconsistent] ?? 0
  const moderateCount = consistencyCounts[GOAL_CONSISTENCY.moderate] ?? 0
  const noDataCount = consistencyCounts[GOAL_CONSISTENCY.noData] ?? 0
  const hasConcerns = inconsistentCount > 0 || moderateCount > 0

  return createGoalRuleResult({
    evidence: [
      {
        label: 'Consistent Goals',
        value: consistencyCounts[GOAL_CONSISTENCY.consistent] ?? 0,
      },
      {
        label: 'Moderate Goals',
        value: moderateCount,
      },
      {
        label: 'Inconsistent Goals',
        value: inconsistentCount,
      },
      {
        label: 'No Data Goals',
        value: noDataCount,
      },
    ],
    id: GOAL_RULE_IDS.contributionConsistency,
    message: hasConcerns
      ? 'Some goal contributions vary across cutoff periods.'
      : 'Goal contribution consistency is stable where contribution history exists.',
    passed: !hasConcerns,
    ruleName: 'Contribution Consistency',
    score: inconsistentCount > 0 ? 45 : moderateCount > 0 ? 75 : 100,
    severity:
      inconsistentCount > 0
        ? INSIGHT_SEVERITY.warning
        : moderateCount > 0
          ? INSIGHT_SEVERITY.info
          : INSIGHT_SEVERITY.success,
    status: hasConcerns ? GOAL_RULE_STATUS.warning : GOAL_RULE_STATUS.pass,
    value: consistencyCounts,
    weight,
  })
}
