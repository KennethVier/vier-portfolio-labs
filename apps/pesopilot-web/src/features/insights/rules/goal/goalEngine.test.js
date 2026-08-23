import { describe, expect, it, vi } from 'vitest'

import { INSIGHT_SCOPES } from '../../utils/insightConstants.js'
import { generateGoalInsight } from './goalEngine.js'

vi.mock('@/features/savings/services/savingsService.js', () => ({
  savingsService: {
    loadSavingsGoals: vi.fn(async () => [
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
    ]),
    loadSavings: vi.fn(async () => [
      {
        amount: 4000,
        cutoffId: 1,
        goalId: 1,
        id: 1,
      },
      {
        amount: 4000,
        cutoffId: 2,
        goalId: 1,
        id: 2,
      },
    ]),
  },
}))

describe('goal engine', () => {
  it('generates a GoalInsight from normalized savings goals and contributions', async () => {
    const insight = await generateGoalInsight({
      scope: INSIGHT_SCOPES.currentCutoff,
    })

    expect(insight.category).toBe('goal')
    expect(insight.scope).toBe(INSIGHT_SCOPES.currentCutoff)
    expect(insight.metrics).toMatchObject({
      totalGoals: 2,
      activeGoals: 2,
      completedGoals: 0,
      totalTargetAmount: 15000,
      totalSavedAmount: 8000,
      overallCompletionRate: 53.33,
      highestFundedGoal: {
        id: 1,
        name: 'Emergency Fund',
        progress: 80,
      },
      goalsWithoutContributions: [
        {
          id: 2,
          name: 'Travel Fund',
        },
      ],
    })
    expect(insight.diagnostics.executedRules).toEqual([
      'goal_aggregation',
      'goal_progress',
      'goal_completion',
      'remaining_amount',
      'highest_funded_goal',
      'goals_without_contributions',
      'contribution_consistency',
    ])
  })
})
