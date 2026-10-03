import { describe, expect, it } from 'vitest'

import {
  filterSummarySectionsByHorizon,
  formatGeneratedAt,
  formatMoney,
  formatPercent,
  getHorizonCoverageNotice,
  mapHealthStatusToTone,
  mapSeverityToTone,
} from './insightsViewTransforms.js'

describe('insightsViewTransforms', () => {
  describe('filterSummarySectionsByHorizon', () => {
    const sampleSections = [
      {
        type: 'current_position',
        title: 'Current Position',
        paragraphs: [
          { key: 'p1', horizon: 'current', text: 'Current text' },
          { key: 'p2', horizon: 'monthly', text: 'Monthly text' },
        ],
      },
      {
        type: 'financial_highlights',
        title: 'Highlights',
        paragraphs: [
          { key: 'p3', horizon: 'monthly', text: 'Monthly highlight' },
          { key: 'p4', horizon: 'historical', text: 'Historical trend' },
        ],
      },
      {
        type: 'risks',
        title: 'Risks',
        paragraphs: [
          { key: 'p5', horizon: 'current', text: 'Current risk' },
        ],
      },
    ]

    it('preserves all sections and paragraphs when horizon is all', () => {
      const result = filterSummarySectionsByHorizon(sampleSections, 'all')

      expect(result).toHaveLength(3)
      expect(result[0].paragraphs).toHaveLength(2)
      expect(result[1].paragraphs).toHaveLength(2)
      expect(result[2].paragraphs).toHaveLength(1)
    })

    it('filters strictly by current horizon and omits empty sections', () => {
      const result = filterSummarySectionsByHorizon(sampleSections, 'current')

      expect(result).toHaveLength(2)
      expect(result[0].type).toBe('current_position')
      expect(result[0].paragraphs).toEqual([
        { key: 'p1', horizon: 'current', text: 'Current text' },
      ])
      expect(result[1].type).toBe('risks')
      expect(result[1].paragraphs).toEqual([
        { key: 'p5', horizon: 'current', text: 'Current risk' },
      ])
    })

    it('filters strictly by monthly horizon and omits sections with no matching paragraphs', () => {
      const result = filterSummarySectionsByHorizon(sampleSections, 'monthly')

      expect(result).toHaveLength(2)
      expect(result[0].type).toBe('current_position')
      expect(result[0].paragraphs).toEqual([
        { key: 'p2', horizon: 'monthly', text: 'Monthly text' },
      ])
      expect(result[1].type).toBe('financial_highlights')
      expect(result[1].paragraphs).toEqual([
        { key: 'p3', horizon: 'monthly', text: 'Monthly highlight' },
      ])
    })

    it('filters strictly by historical horizon', () => {
      const result = filterSummarySectionsByHorizon(sampleSections, 'historical')

      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('financial_highlights')
      expect(result[0].paragraphs).toEqual([
        { key: 'p4', horizon: 'historical', text: 'Historical trend' },
      ])
    })

    it('does not mutate source objects', () => {
      const deepClonedSource = JSON.parse(JSON.stringify(sampleSections))
      filterSummarySectionsByHorizon(sampleSections, 'current')

      expect(sampleSections).toEqual(deepClonedSource)
    })

    it('handles null, undefined, or empty section arrays safely', () => {
      expect(filterSummarySectionsByHorizon(null, 'current')).toEqual([])
      expect(filterSummarySectionsByHorizon(undefined, 'all')).toEqual([])
      expect(filterSummarySectionsByHorizon([], 'monthly')).toEqual([])
    })
  })

  describe('getHorizonCoverageNotice', () => {
    it('returns null for all horizon regardless of coverage object', () => {
      expect(getHorizonCoverageNotice('all', { monthly: 'unavailable' })).toBeNull()
      expect(getHorizonCoverageNotice('all', null)).toBeNull()
    })

    it('returns null when horizon coverage is available', () => {
      const coverage = {
        current: 'available',
        monthly: 'available',
        historical: 'available',
      }
      expect(getHorizonCoverageNotice('current', coverage)).toBeNull()
      expect(getHorizonCoverageNotice('monthly', coverage)).toBeNull()
      expect(getHorizonCoverageNotice('historical', coverage)).toBeNull()
    })

    it('returns truthful notice when horizon coverage is unavailable', () => {
      const coverage = {
        current: 'available',
        monthly: 'unavailable',
        historical: 'unavailable',
      }
      const notice = 'Not enough comparison history is available for this view yet.'

      expect(getHorizonCoverageNotice('monthly', coverage)).toBe(notice)
      expect(getHorizonCoverageNotice('historical', coverage)).toBe(notice)
    })

    it('returns truthful notice safely when coverage is missing or malformed', () => {
      const notice = 'Not enough comparison history is available for this view yet.'

      expect(getHorizonCoverageNotice('monthly', null)).toBe(notice)
      expect(getHorizonCoverageNotice('historical', {})).toBe(notice)
    })
  })

  describe('mapSeverityToTone', () => {
    it('maps known severities correctly', () => {
      expect(mapSeverityToTone('critical')).toBe('critical')
      expect(mapSeverityToTone('warning')).toBe('warning')
      expect(mapSeverityToTone('info')).toBe('info')
      expect(mapSeverityToTone('CRITICAL')).toBe('critical')
    })

    it('maps unknown, null, or empty severities to neutral', () => {
      expect(mapSeverityToTone('low')).toBe('neutral')
      expect(mapSeverityToTone(null)).toBe('neutral')
      expect(mapSeverityToTone(undefined)).toBe('neutral')
      expect(mapSeverityToTone('')).toBe('neutral')
    })
  })

  describe('mapHealthStatusToTone', () => {
    it('maps known health statuses correctly', () => {
      expect(mapHealthStatusToTone('Excellent')).toBe('success')
      expect(mapHealthStatusToTone('Healthy')).toBe('success')
      expect(mapHealthStatusToTone('Needs Attention')).toBe('warning')
      expect(mapHealthStatusToTone('Critical')).toBe('critical')
      expect(mapHealthStatusToTone('Fair')).toBe('neutral')
    })

    it('maps unknown, null, or empty statuses to neutral', () => {
      expect(mapHealthStatusToTone('Unknown')).toBe('neutral')
      expect(mapHealthStatusToTone(null)).toBe('neutral')
      expect(mapHealthStatusToTone('')).toBe('neutral')
    })
  })

  describe('formatting helpers', () => {
    it('formatMoney formats valid numbers and returns fallback for non-numbers', () => {
      expect(formatMoney(1500)).toContain('1,500')
      expect(formatMoney(0)).toContain('0.00')
      expect(formatMoney(null)).toBe('--')
      expect(formatMoney(undefined)).toBe('--')
      expect(formatMoney('string')).toBe('--')
    })

    it('formatPercent formats valid numbers and returns fallback for non-numbers', () => {
      expect(formatPercent(25.4)).toBe('25%')
      expect(formatPercent(0)).toBe('0%')
      expect(formatPercent(null)).toBe('--')
      expect(formatPercent('bad')).toBe('--')
    })

    it('formatGeneratedAt formats valid dates and handles invalid inputs safely', () => {
      expect(formatGeneratedAt('2026-06-28T10:30:00.000Z')).toBeTruthy()
      expect(formatGeneratedAt(null)).toBe('')
      expect(formatGeneratedAt('not-a-date')).toBe('')
    })
  })
})
