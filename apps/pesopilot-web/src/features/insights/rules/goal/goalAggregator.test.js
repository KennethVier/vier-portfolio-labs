import { describe, expect, it } from 'vitest'

import { GOAL_RULE_STATUS } from '../../models/goalRuleResult.js'
import { INSIGHT_SEVERITY } from '../../utils/insightSeverity.js'
import { aggregateGoalRules } from './goalAggregator.js'
import { GOAL_RULE_IDS } from './goalRuleConstants.js'

describe('goal aggregator', () => {
  it('aggregates rule results into GoalInsight evidence, breakdown, diagnostics, and explanation', () => {
    const insight = aggregateGoalRules({
      context: {
        diagnostics: {
          warnings: [],
        },
      },
      metrics: {
        totalGoals: 1,
        overallCompletionRate: 80,
        highestFundedGoal: {
          name: 'Emergency Fund',
        },
        goalsWithoutContributions: [],
      },
      ruleResults: [
        {
          id: GOAL_RULE_IDS.goalProgress,
          ruleName: 'Goal Progress',
          score: 80,
          status: GOAL_RULE_STATUS.pass,
          severity: INSIGHT_SEVERITY.info,
          weight: 20,
          evidence: [
            {
              label: 'Overall Completion Rate',
              value: 80,
            },
          ],
        },
      ],
      scope: 'current_cutoff',
    })

    expect(insight).toMatchObject({
      category: 'goal',
      scope: 'current_cutoff',
      breakdown: [
        {
          id: GOAL_RULE_IDS.goalProgress,
          label: 'Goal Progress',
          score: 80,
          status: GOAL_RULE_STATUS.pass,
          severity: INSIGHT_SEVERITY.info,
          weight: 20,
        },
      ],
      diagnostics: {
        executedRules: [GOAL_RULE_IDS.goalProgress],
        warnings: [],
      },
      evidence: [
        {
          ruleId: GOAL_RULE_IDS.goalProgress,
          label: 'Overall Completion Rate',
          value: 80,
        },
      ],
    })
    expect(insight.explanation).toContain('Overall goal completion is 80%')
  })
})
