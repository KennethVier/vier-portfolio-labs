import { GOAL_CONSISTENCY } from '../../models/goalInsight.js'

function toAmount(value) {
  return Number(value) || 0
}

function roundCurrency(value) {
  return Math.round((Number(value) || 0) * 100) / 100
}

function roundPercent(value) {
  return Math.round((Number(value) || 0) * 100) / 100
}

function clampPercent(value) {
  return Math.min(100, Math.max(0, roundPercent(value)))
}

function groupContributionsByGoal(contributions) {
  return contributions.reduce((groups, contribution) => {
    const key = String(contribution.goalId)
    groups.set(key, [...(groups.get(key) ?? []), contribution])
    return groups
  }, new Map())
}

function calculateProgress(savedAmount, targetAmount) {
  if (targetAmount <= 0) {
    return 0
  }

  return clampPercent((savedAmount / targetAmount) * 100)
}

function calculateContributionConsistency(contributions) {
  if (contributions.length === 0) {
    return {
      status: GOAL_CONSISTENCY.noData,
      contributionCount: 0,
      cutoffCount: 0,
      variancePercent: null,
    }
  }

  const cutoffTotals = contributions.reduce((totals, contribution) => {
    const cutoffKey = contribution.cutoffId ? String(contribution.cutoffId) : 'no_cutoff'
    totals.set(cutoffKey, (totals.get(cutoffKey) ?? 0) + toAmount(contribution.amount))
    return totals
  }, new Map())
  const cutoffAmounts = [...cutoffTotals.values()].filter((amount) => amount > 0)

  if (cutoffAmounts.length < 2) {
    return {
      status: GOAL_CONSISTENCY.moderate,
      contributionCount: contributions.length,
      cutoffCount: cutoffTotals.size,
      variancePercent: null,
    }
  }

  const average =
    cutoffAmounts.reduce((total, amount) => total + amount, 0) / cutoffAmounts.length
  const variancePercent =
    average > 0
      ? Math.max(...cutoffAmounts.map((amount) => Math.abs(amount - average))) /
        average *
        100
      : 0

  let status = GOAL_CONSISTENCY.consistent

  if (variancePercent >= 60) {
    status = GOAL_CONSISTENCY.inconsistent
  } else if (variancePercent >= 25) {
    status = GOAL_CONSISTENCY.moderate
  }

  return {
    status,
    contributionCount: contributions.length,
    cutoffCount: cutoffTotals.size,
    variancePercent: roundPercent(variancePercent),
  }
}

function buildGoalMetric(goal, contributions) {
  const savedAmount = roundCurrency(
    contributions.reduce(
      (total, contribution) => total + toAmount(contribution.amount),
      0,
    ),
  )
  const targetAmount = roundCurrency(goal.targetAmount)
  const progress = calculateProgress(savedAmount, targetAmount)
  const remainingAmount =
    targetAmount > 0 ? roundCurrency(Math.max(targetAmount - savedAmount, 0)) : 0
  const latestContributionDate =
    contributions
      .map((contribution) => contribution.date)
      .filter(Boolean)
      .sort((firstDate, secondDate) => secondDate.localeCompare(firstDate))[0] ?? null

  return {
    id: goal.id ?? null,
    name: goal.name ?? 'Unnamed Goal',
    status: goal.status ?? null,
    targetAmount,
    savedAmount,
    progress,
    remainingAmount,
    contributionCount: contributions.length,
    latestContributionDate,
    completed: Boolean(targetAmount > 0 && savedAmount >= targetAmount),
    contributionConsistency: calculateContributionConsistency(contributions),
  }
}

function getHighestFundedGoal(goals) {
  return (
    goals
      .filter((goal) => goal.status === 'active' && goal.targetAmount > 0)
      .sort((firstGoal, secondGoal) => {
        if (secondGoal.progress !== firstGoal.progress) {
          return secondGoal.progress - firstGoal.progress
        }

        if (secondGoal.savedAmount !== firstGoal.savedAmount) {
          return secondGoal.savedAmount - firstGoal.savedAmount
        }

        return firstGoal.name.localeCompare(secondGoal.name)
      })[0] ?? null
  )
}

export function buildGoalMetrics(context) {
  const contributionsByGoal = groupContributionsByGoal(context.contributions)
  const goals = context.goals.map((goal) =>
    buildGoalMetric(goal, contributionsByGoal.get(String(goal.id)) ?? []),
  )
  const totalTargetAmount = roundCurrency(
    goals.reduce((total, goal) => total + toAmount(goal.targetAmount), 0),
  )
  const totalSavedAmount = roundCurrency(
    goals.reduce((total, goal) => total + toAmount(goal.savedAmount), 0),
  )

  return {
    totalGoals: goals.length,
    activeGoals: goals.filter((goal) => goal.status === 'active').length,
    completedGoals: goals.filter((goal) => goal.completed).length,
    totalTargetAmount,
    totalSavedAmount,
    overallCompletionRate:
      totalTargetAmount > 0
        ? clampPercent((totalSavedAmount / totalTargetAmount) * 100)
        : 0,
    highestFundedGoal: getHighestFundedGoal(goals),
    goalsWithoutContributions: goals.filter((goal) => goal.contributionCount === 0),
    goals,
  }
}

export const goalMetricsInternals = {
  calculateContributionConsistency,
  calculateProgress,
  clampPercent,
}
