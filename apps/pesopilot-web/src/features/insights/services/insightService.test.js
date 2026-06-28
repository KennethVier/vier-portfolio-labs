import { describe, expect, it } from 'vitest'

import { INSIGHT_SCOPES } from '../utils/insightConstants.js'

import { insightService } from './insightService.js'

describe('insightService', () => {
  it('loads an empty InsightBundle with the default scope', async () => {
    await expect(insightService.loadInsights()).resolves.toEqual({
      scope: INSIGHT_SCOPES.currentCutoff,
      generatedAt: expect.any(String),
      health: null,
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

  it('loads an empty InsightBundle for a supplied scope', async () => {
    const bundle = await insightService.loadInsights({
      scope: INSIGHT_SCOPES.specificCutoff,
    })

    expect(bundle.scope).toBe(INSIGHT_SCOPES.specificCutoff)
    expect(bundle.recommendations).toEqual([])
  })
})
