import { describe, expect, it } from 'vitest'

import { INSIGHT_TYPES } from '../models/insightTypes.js'

import {
  DEFAULT_INSIGHT_SCOPE,
  INSIGHT_SCOPES,
} from './insightConstants.js'
import {
  INSIGHT_PRIORITY,
  INSIGHT_PRIORITY_WEIGHT,
  getInsightPriorityWeight,
} from './insightPriority.js'
import { INSIGHT_SEVERITY } from './insightSeverity.js'

describe('insight architecture constants', () => {
  it('defines supported insight categories', () => {
    expect(INSIGHT_TYPES).toEqual({
      cashflow: 'cashflow',
      cutoff: 'cutoff',
      expense: 'expense',
      goal: 'goal',
      health: 'health',
      income: 'income',
      recommendation: 'recommendation',
      savings: 'savings',
      summary: 'summary',
    })
  })

  it('defines supported insight scopes', () => {
    expect(DEFAULT_INSIGHT_SCOPE).toBe('current_cutoff')
    expect(INSIGHT_SCOPES).toEqual({
      allData: 'all_data',
      currentCutoff: 'current_cutoff',
      monthly: 'monthly',
      specificCutoff: 'specific_cutoff',
    })
  })

  it('defines supported severity levels', () => {
    expect(INSIGHT_SEVERITY).toEqual({
      critical: 'critical',
      info: 'info',
      success: 'success',
      warning: 'warning',
    })
  })

  it('defines reusable priorities and stable sort weights', () => {
    expect(INSIGHT_PRIORITY).toEqual({
      high: 'high',
      low: 'low',
      medium: 'medium',
      urgent: 'urgent',
    })
    expect(INSIGHT_PRIORITY_WEIGHT).toEqual({
      low: 1,
      medium: 2,
      high: 3,
      urgent: 4,
    })
    expect(getInsightPriorityWeight(INSIGHT_PRIORITY.urgent)).toBeGreaterThan(
      getInsightPriorityWeight(INSIGHT_PRIORITY.high),
    )
    expect(getInsightPriorityWeight('unknown')).toBe(0)
  })
})
