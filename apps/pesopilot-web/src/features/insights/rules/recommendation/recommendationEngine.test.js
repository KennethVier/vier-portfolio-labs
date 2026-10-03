import { describe, expect, it } from 'vitest'

import { createInsightBundle } from '../../models/insightBundle.js'
import { generateRecommendations } from './recommendationEngine.js'

describe('recommendationEngine', () => {
  it('returns an empty RecommendationBundle when insight bundle is null or empty', () => {
    const bundleNull = generateRecommendations(null)
    expect(bundleNull.recommendations).toEqual([])
    expect(bundleNull.suppressed).toEqual([])
    expect(Object.values(bundleNull.groups).every((g) => g.length === 0)).toBe(true)

    const bundleEmpty = generateRecommendations({})
    expect(bundleEmpty.recommendations).toEqual([])
  })

  it('produces no recommendations when insights reflect healthy/favourable states', () => {
    const bundle = createInsightBundle()
    bundle.health = {
      status: 'Healthy',
      score: 85,
      breakdown: [],
      evidence: [],
    }
    bundle.cashflow = {
      metrics: {
        position: 'Positive',
        spendingPace: { status: 'On Pace' },
        incomeCoverage: { status: 'Covered' },
      },
      evidence: [],
    }
    bundle.expenses = {
      metrics: {
        topSpendingCategory: { categoryName: 'Food', percentage: 25 },
        trend: { direction: 'Stable' },
      },
      evidence: [],
    }

    const recBundle = generateRecommendations(bundle)
    expect(recBundle.recommendations).toEqual([])
    expect(recBundle.suppressed).toEqual([])
  })

  it('generates deterministic recommendations, groups them, and assigns ranks', () => {
    const bundle = createInsightBundle()
    bundle.generatedAt = '2026-06-28T00:00:00.000Z'
    bundle.cashflow = {
      metrics: {
        position: 'Negative',
        spendingPace: { status: 'Fast' },
        incomeCoverage: { status: 'Uncovered' },
      },
      evidence: [
        { ruleId: 'remaining_cash', label: 'Remaining Cash', value: -1000 },
        { ruleId: 'net_cashflow', label: 'Net Cashflow', value: -1500 },
        { ruleId: 'spending_pace', label: 'Pace Delta', value: 30 },
        { ruleId: 'income_coverage', label: 'Coverage', value: 0 },
      ],
    }
    bundle.expenses = {
      metrics: {
        topSpendingCategory: {
          categoryName: 'Dining',
          percentage: 42,
          amount: 5000,
        },
        trend: { direction: 'Increasing', percentageChange: 15 },
      },
      evidence: [
        { ruleId: 'top_spending_category', label: 'Category', value: 'Dining' },
        { ruleId: 'expense_trend', label: 'Change', value: 15 },
      ],
    }

    const recBundle1 = generateRecommendations(bundle)
    const recBundle2 = generateRecommendations(bundle)

    expect(recBundle1).toEqual(recBundle2)
    expect(recBundle1.generatedAt).toBe('2026-06-28T00:00:00.000Z')
    expect(recBundle1.recommendations.length).toBeGreaterThan(0)

    // Check ranks are 1-based sequential
    recBundle1.recommendations.forEach((rec, idx) => {
      expect(rec.rank).toBe(idx + 1)
      expect(rec.evidence.length).toBeGreaterThan(0)
      expect(rec.sourceRuleIds.length).toBeGreaterThan(0)
    })

    // Check grouping
    for (const rec of recBundle1.recommendations) {
      expect(recBundle1.groups[rec.domain]).toContain(rec.id)
    }
  })

  it('does not contain any AI or LLM metadata or generation fields', () => {
    const bundle = createInsightBundle()
    bundle.cashflow = {
      metrics: { position: 'Negative' },
      evidence: [{ ruleId: 'remaining_cash', label: 'Cash', value: -500 }],
    }

    const recBundle = generateRecommendations(bundle)
    const serialized = JSON.stringify(recBundle).toLowerCase()

    expect(serialized.includes('prompt')).toBe(false)
    expect(serialized.includes('openai')).toBe(false)
    expect(serialized.includes('claude')).toBe(false)
    expect(serialized.includes('gemini')).toBe(false)
    expect(serialized.includes('gpt')).toBe(false)
    expect(serialized.includes('llm')).toBe(false)
  })

  it('runs synchronously and does not return a Promise', () => {
    const result = generateRecommendations({})
    expect(result instanceof Promise).toBe(false)
    expect(typeof result.then).toBe('undefined')
  })
})
