import { describe, expect, it } from 'vitest'

import { GOAL_CONSISTENCY } from '../../models/goalInsight.js'
import { buildGoalMetrics, goalMetricsInternals } from './goalMetrics.js'

describe('goal metrics', () => {
  it('calculates progress, remaining amount, completion, and highest funded goal', () => {
    const metrics = buildGoalMetrics({
      goals: [
        {
          id: 1,
          name: 'Emergency Fund',
          status: 'active',
          targetAmount: 10000,
        },
        {
          id: 2,
          name: 'Travel Fund',
          status: 'active',
          targetAmount: 5000,
        },
        {
          id: 3,
          name: 'Laptop',
          status: 'completed',
          targetAmount: 4000,
        },
      ],
      contributions: [
        { amount: 6000, cutoffId: 1, goalId: 1 },
        { amount: 2000, cutoffId: 2, goalId: 1 },
        { amount: 5000, cutoffId: 1, goalId: 2 },
        { amount: 5000, cutoffId: 1, goalId: 3 },
      ],
    })

    expect(metrics).toMatchObject({
      totalGoals: 3,
      activeGoals: 2,
      completedGoals: 2,
      totalTargetAmount: 19000,
      totalSavedAmount: 18000,
      overallCompletionRate: 94.74,
      highestFundedGoal: {
        id: 2,
        name: 'Travel Fund',
        progress: 100,
        savedAmount: 5000,
      },
    })
    expect(metrics.goals[0]).toMatchObject({
      completed: false,
      progress: 80,
      remainingAmount: 2000,
      savedAmount: 8000,
    })
    expect(metrics.goals[1]).toMatchObject({
      completed: true,
      progress: 100,
      remainingAmount: 0,
    })
  })

  it('detects goals without linked contributions', () => {
    const metrics = buildGoalMetrics({
      goals: [
        { id: 1, name: 'Funded', status: 'active', targetAmount: 1000 },
        { id: 2, name: 'Unfunded', status: 'active', targetAmount: 1000 },
      ],
      contributions: [{ amount: 500, cutoffId: 1, goalId: 1 }],
    })

    expect(metrics.goalsWithoutContributions).toEqual([
      expect.objectContaining({
        id: 2,
        name: 'Unfunded',
        contributionCount: 0,
      }),
    ])
  })

  it('classifies contribution consistency from linked savings contributions', () => {
    expect(goalMetricsInternals.calculateContributionConsistency([])).toMatchObject({
      status: GOAL_CONSISTENCY.noData,
    })
    expect(
      goalMetricsInternals.calculateContributionConsistency([
        { amount: 1000, cutoffId: 1 },
        { amount: 1050, cutoffId: 2 },
      ]),
    ).toMatchObject({
      status: GOAL_CONSISTENCY.consistent,
    })
    expect(
      goalMetricsInternals.calculateContributionConsistency([
        { amount: 1000, cutoffId: 1 },
        { amount: 1800, cutoffId: 2 },
      ]),
    ).toMatchObject({
      status: GOAL_CONSISTENCY.moderate,
    })
    expect(
      goalMetricsInternals.calculateContributionConsistency([
        { amount: 1000, cutoffId: 1 },
        { amount: 5000, cutoffId: 2 },
      ]),
    ).toMatchObject({
      status: GOAL_CONSISTENCY.inconsistent,
    })
  })

  it('clamps progress between 0 and 100', () => {
    expect(goalMetricsInternals.calculateProgress(1500, 1000)).toBe(100)
    expect(goalMetricsInternals.calculateProgress(-100, 1000)).toBe(0)
  })
})
