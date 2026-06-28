import { describe, expect, it, vi } from 'vitest'

import { INSIGHT_SCOPES } from '../utils/insightConstants.js'

import { insightService } from './insightService.js'

vi.mock('../rules/health/healthEngine.js', () => ({
  generateHealthInsight: vi.fn(async ({ scope }) => ({
    category: 'health',
    scope,
    generatedAt: '2026-06-28T00:00:00.000Z',
    score: 80,
    status: 'Healthy',
    breakdown: [],
    strengths: [],
    weaknesses: [],
    evidence: [],
    explanation: 'Financial health is Healthy with a score of 80.',
    diagnostics: {
      executedRules: [],
      warnings: [],
    },
  })),
}))

describe('insightService', () => {
  it('loads an InsightBundle with only health populated by default', async () => {
    await expect(insightService.loadInsights()).resolves.toEqual({
      scope: INSIGHT_SCOPES.currentCutoff,
      generatedAt: expect.any(String),
      health: {
        category: 'health',
        scope: INSIGHT_SCOPES.currentCutoff,
        generatedAt: '2026-06-28T00:00:00.000Z',
        score: 80,
        status: 'Healthy',
        breakdown: [],
        strengths: [],
        weaknesses: [],
        evidence: [],
        explanation: 'Financial health is Healthy with a score of 80.',
        diagnostics: {
          executedRules: [],
          warnings: [],
        },
      },
      income: null,
      expenses: null,
      savings: null,
      goals: null,
      cashflow: null,
      cutoff: null,
      recommendations: [],
      summary: null,
    })
  })

  it('loads health for a supplied scope without filling other sections', async () => {
    const bundle = await insightService.loadInsights({
      scope: INSIGHT_SCOPES.specificCutoff,
    })

    expect(bundle.scope).toBe(INSIGHT_SCOPES.specificCutoff)
    expect(bundle.health.scope).toBe(INSIGHT_SCOPES.specificCutoff)
    expect(bundle.income).toBeNull()
    expect(bundle.expenses).toBeNull()
    expect(bundle.savings).toBeNull()
    expect(bundle.goals).toBeNull()
    expect(bundle.cashflow).toBeNull()
    expect(bundle.cutoff).toBeNull()
    expect(bundle.summary).toBeNull()
    expect(bundle.recommendations).toEqual([])
  })
})
