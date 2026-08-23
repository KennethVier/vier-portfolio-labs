import { describe, expect, it } from 'vitest'

import { GOAL_CONSISTENCY } from '../../models/goalInsight.js'
import { GOAL_RULE_STATUS } from '../../models/goalRuleResult.js'
import { GOAL_RULE_IDS } from './goalRuleConstants.js'
import {
  evaluateContributionConsistency,
  evaluateGoalsWithoutContributions,
  evaluateHighestFundedGoal,
} from './goalRules.js'

describe('goal rules', () => {
  it('flags goals without linked savings contributions', () => {
    const result = evaluateGoalsWithoutContributions(
      {
        metrics: {
          totalGoals: 2,
          goalsWithoutContributions: [
            {
              id: 2,
              name: 'Travel Fund',
            },
          ],
        },
      },
      10,
    )

    expect(result).toMatchObject({
      id: GOAL_RULE_IDS.goalsWithoutContributions,
      passed: false,
      status: GOAL_RULE_STATUS.warning,
      value: [
        {
          id: 2,
          name: 'Travel Fund',
        },
      ],
    })
  })

  it('reports highest funded goal by active completion percentage', () => {
    const result = evaluateHighestFundedGoal(
      {
        metrics: {
          highestFundedGoal: {
            id: 1,
            name: 'Emergency Fund',
            progress: 80,
            savedAmount: 8000,
          },
        },
      },
      12,
    )

    expect(result).toMatchObject({
      id: GOAL_RULE_IDS.highestFundedGoal,
      passed: true,
      value: {
        id: 1,
        name: 'Emergency Fund',
      },
      evidence: [
        {
          label: 'Goal',
          value: 'Emergency Fund',
        },
        {
          label: 'Completion',
          value: 80,
        },
        {
          label: 'Saved Amount',
          value: 8000,
        },
      ],
    })
  })

  it('aggregates contribution consistency states', () => {
    const result = evaluateContributionConsistency(
      {
        metrics: {
          totalGoals: 3,
          goals: [
            {
              contributionConsistency: {
                status: GOAL_CONSISTENCY.consistent,
              },
            },
            {
              contributionConsistency: {
                status: GOAL_CONSISTENCY.moderate,
              },
            },
            {
              contributionConsistency: {
                status: GOAL_CONSISTENCY.noData,
              },
            },
          ],
        },
      },
      13,
    )

    expect(result).toMatchObject({
      id: GOAL_RULE_IDS.contributionConsistency,
      passed: false,
      status: GOAL_RULE_STATUS.warning,
      value: {
        [GOAL_CONSISTENCY.consistent]: 1,
        [GOAL_CONSISTENCY.moderate]: 1,
        [GOAL_CONSISTENCY.noData]: 1,
      },
    })
  })

  it('does not mutate normalized context', () => {
    const context = Object.freeze({
      metrics: Object.freeze({
        totalGoals: 0,
        goalsWithoutContributions: Object.freeze([]),
      }),
    })

    expect(() => evaluateGoalsWithoutContributions(context, 10)).not.toThrow()
    expect(context.metrics.totalGoals).toBe(0)
  })
})
