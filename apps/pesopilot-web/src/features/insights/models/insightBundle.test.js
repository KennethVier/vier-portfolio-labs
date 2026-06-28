import { describe, expect, it } from 'vitest'

import { INSIGHT_SCOPES } from '../utils/insightConstants.js'

import { createInsightBundle } from './insightBundle.js'

function expectIsoString(value) {
  expect(typeof value).toBe('string')
  expect(Number.isNaN(Date.parse(value))).toBe(false)
  expect(new Date(value).toISOString()).toBe(value)
}

describe('createInsightBundle', () => {
  it('creates the default empty current-cutoff bundle shape', () => {
    const bundle = createInsightBundle()

    expect(bundle).toEqual({
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
    expectIsoString(bundle.generatedAt)
  })

  it('creates a bundle for the supplied scope', () => {
    const bundle = createInsightBundle({ scope: INSIGHT_SCOPES.allData })

    expect(bundle.scope).toBe(INSIGHT_SCOPES.allData)
    expectIsoString(bundle.generatedAt)
  })
})
