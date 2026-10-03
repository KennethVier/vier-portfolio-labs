import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { db } from '@/lib/db/dexie.js'
import { clearDatabase } from '@/lib/db/devTools.js'

import {
  summaryHistoryService,
  SUMMARY_HISTORY_TYPES,
} from './summaryHistoryService.js'

function createMockSummary({
  state = 'ready',
  version = '1.0.0',
  engineVersion = '1.0.0',
  narrativeVersion = '1.0.0',
  templateVersion = '1.0.0',
  generatedAt = '2026-06-15T12:00:00.000Z',
  sections = [
    {
      type: 'executive',
      title: 'Executive Summary',
      paragraphs: [
        {
          key: 'summary_exec',
          templateId: 'health.good',
          text: 'Financial position is sound.',
          horizon: 'current',
          relatedInsights: ['health.overall'],
          relatedRecommendations: ['REC_EXP_REDUCE_DINING'],
          evidence: [{ metric: 'remainingCash', value: 15000 }],
        },
      ],
    },
  ],
} = {}) {
  return {
    version,
    scope: 'current_cutoff',
    generatedAt,
    sections,
    diagnostics: {
      counts: { actions: 1, highlights: 1, positives: 1, risks: 0 },
      coverage: {
        current: 'available',
        historical: 'unavailable',
        monthly: 'available',
      },
      omitted: [],
      state,
      warnings: [],
    },
    metadata: {
      engineVersion,
      generatedAt,
      language: 'en',
      narrativeVersion,
      summaryId: `summary:current_cutoff:${generatedAt}`,
      summaryType: 'standard',
      templateVersion,
    },
  }
}

function createMockCutoff({
  id = 1,
  startDate = '2026-06-01',
  endDate = '2026-06-15',
  status = 'active',
} = {}) {
  return {
    id,
    startDate,
    endDate,
    status,
    type: 'semi_monthly',
    name: 'June Cutoff 1',
  }
}

beforeEach(async () => {
  await db.open()
  await clearDatabase()
})

afterEach(async () => {
  await clearDatabase()
  db.close()
})

describe('summaryHistoryService', () => {
  it('1. persists ready FinancialSummary for current cutoff', async () => {
    const summary = createMockSummary()
    const cutoff = createMockCutoff()

    const persisted = await summaryHistoryService.captureSummary({ summary, cutoff })

    expect(persisted).toBeDefined()
    expect(persisted.id).toBeTypeOf('number')
    expect(persisted.type).toBe(SUMMARY_HISTORY_TYPES.cutoffSummary)
    expect(persisted.cutoffId).toBe(cutoff.id)
    expect(persisted.periodKey).toBe('2026-06')
  })

  it('2. uses content for full FinancialSummary payload', async () => {
    const summary = createMockSummary()
    const cutoff = createMockCutoff()

    const persisted = await summaryHistoryService.captureSummary({ summary, cutoff })

    expect(persisted.content).toEqual(summary)
    expect(persisted.summary).toBeUndefined()
  })

  it('3. preserves summary.generatedAt', async () => {
    const generatedAt = '2026-06-15T09:30:00.000Z'
    const summary = createMockSummary({ generatedAt })
    const cutoff = createMockCutoff()

    const persisted = await summaryHistoryService.captureSummary({ summary, cutoff })

    expect(persisted.generatedAt).toBe(generatedAt)
    expect(persisted.content.generatedAt).toBe(generatedAt)
  })

  it('4. creates createdAt and updatedAt storage timestamps', async () => {
    const summary = createMockSummary()
    const cutoff = createMockCutoff()

    const persisted = await summaryHistoryService.captureSummary({ summary, cutoff })

    expect(persisted.createdAt).toBeTypeOf('string')
    expect(persisted.updatedAt).toBeTypeOf('string')
    expect(new Date(persisted.createdAt).getTime()).not.toBeNaN()
    expect(new Date(persisted.updatedAt).getTime()).not.toBeNaN()
  })

  it('5. repeated same-version capture updates same row instead of duplicating', async () => {
    const summary1 = createMockSummary({ generatedAt: '2026-06-15T10:00:00.000Z' })
    const summary2 = createMockSummary({ generatedAt: '2026-06-15T11:00:00.000Z' })
    const cutoff = createMockCutoff()

    const firstPersisted = await summaryHistoryService.captureSummary({
      summary: summary1,
      cutoff,
    })
    const secondPersisted = await summaryHistoryService.captureSummary({
      summary: summary2,
      cutoff,
    })

    const allRecords = await db.ai_insights.toArray()

    expect(allRecords).toHaveLength(1)
    expect(secondPersisted.id).toBe(firstPersisted.id)
  })

  it('6. same-version update preserves createdAt', async () => {
    const summary1 = createMockSummary({ generatedAt: '2026-06-15T10:00:00.000Z' })
    const summary2 = createMockSummary({ generatedAt: '2026-06-15T11:00:00.000Z' })
    const cutoff = createMockCutoff()

    const firstPersisted = await summaryHistoryService.captureSummary({
      summary: summary1,
      cutoff,
    })
    const initialCreatedAt = firstPersisted.createdAt

    const secondPersisted = await summaryHistoryService.captureSummary({
      summary: summary2,
      cutoff,
    })

    expect(secondPersisted.createdAt).toBe(initialCreatedAt)
  })

  it('7. same-version update refreshes generatedAt/updatedAt/content', async () => {
    const summary1 = createMockSummary({ generatedAt: '2026-06-15T10:00:00.000Z' })
    const summary2 = createMockSummary({
      generatedAt: '2026-06-15T12:00:00.000Z',
      sections: [{ type: 'executive', title: 'Updated Exec', paragraphs: [] }],
    })
    const cutoff = createMockCutoff()

    await summaryHistoryService.captureSummary({ summary: summary1, cutoff })
    const updated = await summaryHistoryService.captureSummary({
      summary: summary2,
      cutoff,
    })

    expect(updated.generatedAt).toBe('2026-06-15T12:00:00.000Z')
    expect(updated.content.sections[0].title).toBe('Updated Exec')
    expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(updated.createdAt).getTime(),
    )
  })

  it('8. new version tuple appends a second versioned record', async () => {
    const summaryV1 = createMockSummary({ version: '1.0.0', engineVersion: '1.0.0' })
    const summaryV2 = createMockSummary({ version: '1.1.0', engineVersion: '1.1.0' })
    const cutoff = createMockCutoff()

    const firstRecord = await summaryHistoryService.captureSummary({
      summary: summaryV1,
      cutoff,
    })
    const secondRecord = await summaryHistoryService.captureSummary({
      summary: summaryV2,
      cutoff,
    })

    const allRecords = await db.ai_insights.toArray()

    expect(allRecords).toHaveLength(2)
    expect(secondRecord.id).not.toBe(firstRecord.id)
    expect(firstRecord.artifactVersion).toBe('1.0.0')
    expect(secondRecord.artifactVersion).toBe('1.1.0')
  })

  it('9. different cutoff IDs remain distinct', async () => {
    const summary1 = createMockSummary()
    const summary2 = createMockSummary()
    const cutoff1 = createMockCutoff({ id: 1, startDate: '2026-06-01' })
    const cutoff2 = createMockCutoff({ id: 2, startDate: '2026-06-16' })

    await summaryHistoryService.captureSummary({ summary: summary1, cutoff: cutoff1 })
    await summaryHistoryService.captureSummary({ summary: summary2, cutoff: cutoff2 })

    const allRecords = await db.ai_insights.toArray()

    expect(allRecords).toHaveLength(2)
    expect(await summaryHistoryService.getCutoffSummary(1)).toMatchObject({ cutoffId: 1 })
    expect(await summaryHistoryService.getCutoffSummary(2)).toMatchObject({ cutoffId: 2 })
  })

  it('10. empty summary is not persisted', async () => {
    const emptySummary = createMockSummary({ state: 'empty' })
    const cutoff = createMockCutoff()

    const result = await summaryHistoryService.captureSummary({
      summary: emptySummary,
      cutoff,
    })

    expect(result).toBeNull()
    const allRecords = await db.ai_insights.toArray()
    expect(allRecords).toHaveLength(0)
  })

  it('11. null/malformed summary safely returns null', async () => {
    const cutoff = createMockCutoff()

    expect(
      await summaryHistoryService.captureSummary({ summary: null, cutoff }),
    ).toBeNull()
    expect(
      await summaryHistoryService.captureSummary({ summary: {}, cutoff }),
    ).toBeNull()
    expect(
      await summaryHistoryService.captureSummary({
        summary: { diagnostics: { state: 'ready' } },
        cutoff,
      }),
    ).toBeNull()

    const allRecords = await db.ai_insights.toArray()
    expect(allRecords).toHaveLength(0)
  })

  it('12. missing cutoff safely returns null', async () => {
    const summary = createMockSummary()

    expect(
      await summaryHistoryService.captureSummary({ summary, cutoff: null }),
    ).toBeNull()
    expect(
      await summaryHistoryService.captureSummary({
        summary,
        cutoff: { id: null, startDate: '2026-06-01' },
      }),
    ).toBeNull()
    expect(
      await summaryHistoryService.captureSummary({
        summary,
        cutoff: { id: 1, startDate: '' },
      }),
    ).toBeNull()

    const allRecords = await db.ai_insights.toArray()
    expect(allRecords).toHaveLength(0)
  })

  it('13. getSummaryHistory returns deterministic newest-first ordering', async () => {
    const cutoff1 = createMockCutoff({ id: 1, startDate: '2026-05-01' })
    const cutoff2 = createMockCutoff({ id: 2, startDate: '2026-06-01' })
    const cutoff3 = createMockCutoff({ id: 3, startDate: '2026-07-01' })

    await summaryHistoryService.captureSummary({
      summary: createMockSummary({ generatedAt: '2026-05-15T00:00:00.000Z' }),
      cutoff: cutoff1,
    })
    await summaryHistoryService.captureSummary({
      summary: createMockSummary({ generatedAt: '2026-07-15T00:00:00.000Z' }),
      cutoff: cutoff3,
    })
    await summaryHistoryService.captureSummary({
      summary: createMockSummary({ generatedAt: '2026-06-15T00:00:00.000Z' }),
      cutoff: cutoff2,
    })

    const history = await summaryHistoryService.getSummaryHistory()

    expect(history.map((record) => record.cutoffId)).toEqual([3, 2, 1])
  })

  it('14. getSummaryHistory returns [] when empty', async () => {
    const history = await summaryHistoryService.getSummaryHistory()
    expect(history).toEqual([])
  })

  it('15. getCutoffSummary returns latest version for cutoff', async () => {
    const cutoff = createMockCutoff({ id: 5 })
    await summaryHistoryService.captureSummary({
      summary: createMockSummary({
        version: '1.0.0',
        engineVersion: '1.0.0',
        generatedAt: '2026-06-01T00:00:00.000Z',
      }),
      cutoff,
    })
    await summaryHistoryService.captureSummary({
      summary: createMockSummary({
        version: '2.0.0',
        engineVersion: '2.0.0',
        generatedAt: '2026-06-05T00:00:00.000Z',
      }),
      cutoff,
    })

    const result = await summaryHistoryService.getCutoffSummary(5)

    expect(result).toBeDefined()
    expect(result.cutoffId).toBe(5)
    expect(result.artifactVersion).toBe('2.0.0')
  })

  it('16. getCutoffSummary returns null when missing', async () => {
    const result = await summaryHistoryService.getCutoffSummary(999)
    expect(result).toBeNull()

    expect(await summaryHistoryService.getCutoffSummary(null)).toBeNull()
  })

  it('17. getMonthlyHistory dedupes multiple cutoff records by periodKey', async () => {
    const cutoff1 = createMockCutoff({ id: 1, startDate: '2026-06-01' })
    const cutoff2 = createMockCutoff({ id: 2, startDate: '2026-06-16' })
    const cutoff3 = createMockCutoff({ id: 3, startDate: '2026-07-01' })

    await summaryHistoryService.captureSummary({
      summary: createMockSummary({ generatedAt: '2026-06-15T00:00:00.000Z' }),
      cutoff: cutoff1,
    })
    await summaryHistoryService.captureSummary({
      summary: createMockSummary({ generatedAt: '2026-06-30T00:00:00.000Z' }),
      cutoff: cutoff2,
    })
    await summaryHistoryService.captureSummary({
      summary: createMockSummary({ generatedAt: '2026-07-15T00:00:00.000Z' }),
      cutoff: cutoff3,
    })

    const monthlyHistory = await summaryHistoryService.getMonthlyHistory()

    expect(monthlyHistory).toHaveLength(2)
    expect(monthlyHistory.map((record) => record.periodKey)).toEqual([
      '2026-07',
      '2026-06',
    ])
  })

  it('18. getMonthlyHistory chooses newest record within same month', async () => {
    const cutoff1 = createMockCutoff({ id: 1, startDate: '2026-06-01' })
    const cutoff2 = createMockCutoff({ id: 2, startDate: '2026-06-16' })

    await summaryHistoryService.captureSummary({
      summary: createMockSummary({ generatedAt: '2026-06-15T00:00:00.000Z' }),
      cutoff: cutoff1,
    })
    await summaryHistoryService.captureSummary({
      summary: createMockSummary({ generatedAt: '2026-06-30T00:00:00.000Z' }),
      cutoff: cutoff2,
    })

    const monthlyHistory = await summaryHistoryService.getMonthlyHistory()

    expect(monthlyHistory).toHaveLength(1)
    expect(monthlyHistory[0].cutoffId).toBe(2)
    expect(monthlyHistory[0].generatedAt).toBe('2026-06-30T00:00:00.000Z')
  })

  it('19. getMonthlyHistory applies limit after month dedupe', async () => {
    const months = ['2026-01', '2026-02', '2026-03', '2026-04']
    let cutoffId = 1

    for (const month of months) {
      await summaryHistoryService.captureSummary({
        summary: createMockSummary({ generatedAt: `${month}-15T00:00:00.000Z` }),
        cutoff: createMockCutoff({ id: cutoffId++, startDate: `${month}-01` }),
      })
      await summaryHistoryService.captureSummary({
        summary: createMockSummary({ generatedAt: `${month}-28T00:00:00.000Z` }),
        cutoff: createMockCutoff({ id: cutoffId++, startDate: `${month}-16` }),
      })
    }

    const monthlyHistory = await summaryHistoryService.getMonthlyHistory({ limit: 2 })

    expect(monthlyHistory).toHaveLength(2)
    expect(monthlyHistory.map((record) => record.periodKey)).toEqual([
      '2026-04',
      '2026-03',
    ])
  })

  it('20. getMonthlySummary returns newest record for exact periodKey', async () => {
    const cutoff1 = createMockCutoff({ id: 1, startDate: '2026-06-01' })
    const cutoff2 = createMockCutoff({ id: 2, startDate: '2026-06-16' })

    await summaryHistoryService.captureSummary({
      summary: createMockSummary({ generatedAt: '2026-06-15T00:00:00.000Z' }),
      cutoff: cutoff1,
    })
    await summaryHistoryService.captureSummary({
      summary: createMockSummary({ generatedAt: '2026-06-30T00:00:00.000Z' }),
      cutoff: cutoff2,
    })

    const juneSummary = await summaryHistoryService.getMonthlySummary('2026-06')

    expect(juneSummary).toBeDefined()
    expect(juneSummary.periodKey).toBe('2026-06')
    expect(juneSummary.cutoffId).toBe(2)
  })

  it('21. getMonthlySummary returns null when missing', async () => {
    expect(await summaryHistoryService.getMonthlySummary('2025-01')).toBeNull()
    expect(await summaryHistoryService.getMonthlySummary(null)).toBeNull()
    expect(await summaryHistoryService.getMonthlySummary('')).toBeNull()
  })

  it('22. full FinancialSummary structure survives persistence/retrieval', async () => {
    const summary = createMockSummary()
    const cutoff = createMockCutoff()

    await summaryHistoryService.captureSummary({ summary, cutoff })
    const retrieved = await summaryHistoryService.getCutoffSummary(cutoff.id)

    expect(retrieved.content).toEqual(summary)
    expect(retrieved.content.sections[0].paragraphs[0].relatedInsights).toEqual([
      'health.overall',
    ])
    expect(retrieved.content.sections[0].paragraphs[0].relatedRecommendations).toEqual([
      'REC_EXP_REDUCE_DINING',
    ])
    expect(retrieved.content.sections[0].paragraphs[0].evidence).toEqual([
      { metric: 'remainingCash', value: 15000 },
    ])
  })

  it('23. no raw InsightBundle fields are added to the record', async () => {
    const summary = createMockSummary()
    const cutoff = createMockCutoff()

    const persisted = await summaryHistoryService.captureSummary({ summary, cutoff })

    expect(persisted.health).toBeUndefined()
    expect(persisted.expenses).toBeUndefined()
    expect(persisted.income).toBeUndefined()
    expect(persisted.savings).toBeUndefined()
    expect(persisted.goals).toBeUndefined()
    expect(persisted.cashflow).toBeUndefined()
    expect(persisted.cutoff).toBeUndefined()
    expect(persisted.recommendations).toBeUndefined()
    expect(persisted.insightBundle).toBeUndefined()
    expect(persisted.recommendationBundle).toBeUndefined()
  })
})
