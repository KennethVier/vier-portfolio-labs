import { describe, expect, it } from 'vitest'

import { createEmptyGoalMetrics, createGoalInsight } from './goalInsight.js'

describe('GoalInsight model', () => {
  it('creates the default GoalInsight shape', () => {
    const insight = createGoalInsight({ scope: 'current_cutoff' })

    expect(insight).toEqual({
      category: 'goal',
      scope: 'current_cutoff',
      generatedAt: expect.any(String),
      metrics: createEmptyGoalMetrics(),
      breakdown: [],
      evidence: [],
      explanation: '',
      diagnostics: {
        executedRules: [],
        warnings: [],
      },
    })
    expect(new Date(insight.generatedAt).toISOString()).toBe(insight.generatedAt)
  })

  it('accepts supplied metrics and scope', () => {
    const metrics = {
      ...createEmptyGoalMetrics(),
      totalGoals: 1,
      activeGoals: 1,
    }

    expect(
      createGoalInsight({
        generatedAt: '2026-06-28T00:00:00.000Z',
        metrics,
        scope: 'specific_cutoff',
      }),
    ).toMatchObject({
      category: 'goal',
      generatedAt: '2026-06-28T00:00:00.000Z',
      metrics,
      scope: 'specific_cutoff',
    })
  })
})
