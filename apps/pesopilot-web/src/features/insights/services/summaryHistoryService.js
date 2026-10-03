import { aiInsightRepository } from '@/lib/db/repositories/aiInsightRepository.js'

export const SUMMARY_HISTORY_TYPES = Object.freeze({
  cutoffSummary: 'cutoff_summary',
})

function nowIso() {
  return new Date().toISOString()
}

function isValidCutoffId(id) {
  if (typeof id === 'number') {
    return Number.isFinite(id)
  }
  if (typeof id === 'string') {
    return id.trim().length > 0
  }
  return false
}

function isValidStartDate(startDate) {
  return typeof startDate === 'string' && startDate.trim().length >= 7
}

function sortSummariesDesc(records) {
  return [...records].sort((first, second) => {
    const firstDate = first?.generatedAt ? new Date(first.generatedAt).getTime() : NaN
    const secondDate = second?.generatedAt ? new Date(second.generatedAt).getTime() : NaN

    const firstValid = !Number.isNaN(firstDate)
    const secondValid = !Number.isNaN(secondDate)

    if (firstValid && secondValid) {
      if (secondDate !== firstDate) {
        return secondDate - firstDate
      }
    } else if (firstValid && !secondValid) {
      return -1
    } else if (!firstValid && secondValid) {
      return 1
    }

    const firstId = Number(first?.id) || 0
    const secondId = Number(second?.id) || 0
    return secondId - firstId
  })
}

export const summaryHistoryService = {
  async captureSummary({ summary, cutoff } = {}) {
    const cutoffId = cutoff?.id ?? cutoff?.cutoffId

    if (
      !summary ||
      typeof summary !== 'object' ||
      !summary.metadata ||
      summary.diagnostics?.state !== 'ready' ||
      !cutoff ||
      typeof cutoff !== 'object' ||
      !isValidCutoffId(cutoffId) ||
      !isValidStartDate(cutoff.startDate)
    ) {
      return null
    }

    const periodKey = cutoff.startDate.slice(0, 7)
    const artifactVersion = summary.version
    const engineVersion = summary.metadata?.engineVersion
    const narrativeVersion = summary.metadata?.narrativeVersion
    const templateVersion = summary.metadata?.templateVersion

    const existingRecords = await aiInsightRepository.findByCutoff(cutoffId)
    const cutoffRecords = existingRecords.filter(
      (record) => record?.type === SUMMARY_HISTORY_TYPES.cutoffSummary,
    )

    const existingSameVersion = cutoffRecords.find(
      (record) =>
        record?.artifactVersion === artifactVersion &&
        record?.engineVersion === engineVersion &&
        record?.narrativeVersion === narrativeVersion &&
        record?.templateVersion === templateVersion,
    )

    const timestamp = nowIso()

    if (existingSameVersion) {
      const changes = {
        content: summary,
        summaryId: summary.metadata?.summaryId,
        generatedAt: summary.generatedAt,
        updatedAt: timestamp,
        scope: summary.scope,
        periodKey,
        summaryType: summary.metadata?.summaryType,
        language: summary.metadata?.language,
      }

      await aiInsightRepository.update(existingSameVersion.id, changes)
      return aiInsightRepository.findById(existingSameVersion.id)
    }

    const newRecord = {
      type: SUMMARY_HISTORY_TYPES.cutoffSummary,
      cutoffId,
      title: 'Financial Summary',
      content: summary,
      severity: null,
      generatedFrom: 'deterministic_summary_engine',
      createdAt: timestamp,
      updatedAt: timestamp,
      scope: summary.scope,
      periodKey,
      summaryId: summary.metadata?.summaryId,
      generatedAt: summary.generatedAt,
      artifactVersion,
      engineVersion,
      narrativeVersion,
      templateVersion,
      summaryType: summary.metadata?.summaryType,
      language: summary.metadata?.language,
    }

    const id = await aiInsightRepository.create(newRecord)
    return aiInsightRepository.findById(id)
  },

  async getSummaryHistory({ limit = 20 } = {}) {
    const records = await aiInsightRepository.findByType(
      SUMMARY_HISTORY_TYPES.cutoffSummary,
    )
    const sorted = sortSummariesDesc(records)

    return typeof limit === 'number' && limit > 0
      ? sorted.slice(0, limit)
      : sorted
  },

  async getCutoffSummary(cutoffId) {
    if (cutoffId == null) {
      return null
    }

    const records = await aiInsightRepository.findByCutoff(cutoffId)
    const cutoffRecords = records.filter(
      (record) => record?.type === SUMMARY_HISTORY_TYPES.cutoffSummary,
    )

    if (cutoffRecords.length === 0) {
      return null
    }

    const sorted = sortSummariesDesc(cutoffRecords)
    return sorted[0] ?? null
  },

  async getMonthlyHistory({ limit = 12 } = {}) {
    const records = await aiInsightRepository.findByType(
      SUMMARY_HISTORY_TYPES.cutoffSummary,
    )
    const sorted = sortSummariesDesc(records)

    const seenPeriods = new Set()
    const dedupedByPeriod = []

    for (const record of sorted) {
      if (record?.periodKey && !seenPeriods.has(record.periodKey)) {
        seenPeriods.add(record.periodKey)
        dedupedByPeriod.push(record)
      }
    }

    return typeof limit === 'number' && limit > 0
      ? dedupedByPeriod.slice(0, limit)
      : dedupedByPeriod
  },

  async getMonthlySummary(periodKey) {
    if (!periodKey || typeof periodKey !== 'string') {
      return null
    }

    const records = await aiInsightRepository.findByType(
      SUMMARY_HISTORY_TYPES.cutoffSummary,
    )
    const matching = records.filter((record) => record?.periodKey === periodKey)

    if (matching.length === 0) {
      return null
    }

    const sorted = sortSummariesDesc(matching)
    return sorted[0] ?? null
  },
}
