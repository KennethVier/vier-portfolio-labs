import { salaryCutoffRepository } from '@/lib/db/repositories/salaryCutoffRepository.js'
import { savingsRepository } from '@/lib/db/repositories/savingsRepository.js'
import { filterRecordsByCurrentCutoff } from '@/features/shared/utils/currentCutoffFilters.js'
import { cutoffService } from '@/features/salary-cutoff/services/cutoffService.js'

import { EMPTY_SAVINGS_FILTERS } from '../constants/savingsConstants.js'
import { savingsSchema } from '../schemas/savingsSchema.js'

export const DELETED_CUTOFF_LABEL = 'Deleted Cutoff'

function nowIso() {
  return new Date().toISOString()
}

function normalizeSavingsPayload(payload, existingSavings = null) {
  const parsedSavings = savingsSchema.parse(payload)
  const timestamp = nowIso()

  return {
    amount: parsedSavings.amount,
    source: parsedSavings.source,
    date: parsedSavings.date,
    cutoffId: parsedSavings.cutoffId,
    note: parsedSavings.note,
    createdAt: existingSavings?.createdAt ?? timestamp,
    updatedAt: timestamp,
  }
}

function normalizeSearchText(value) {
  return String(value ?? '').trim().toLowerCase()
}

function isWithinDateRange(savings, filters) {
  if (filters.startDate && savings.date < filters.startDate) {
    return false
  }

  if (filters.endDate && savings.date > filters.endDate) {
    return false
  }

  return true
}

function matchesSearch(savings, searchText) {
  if (!searchText) {
    return true
  }

  return [savings.source, savings.note].some((value) =>
    normalizeSearchText(value).includes(searchText),
  )
}

function applySavingsFilters(savingsRecords, filters = EMPTY_SAVINGS_FILTERS) {
  const searchText = normalizeSearchText(filters.search)

  return savingsRecords.filter((savings) => {
    if (filters.cutoffId && String(savings.cutoffId) !== String(filters.cutoffId)) {
      return false
    }

    if (filters.source && savings.source !== filters.source) {
      return false
    }

    if (!isWithinDateRange(savings, filters)) {
      return false
    }

    return matchesSearch(savings, searchText)
  })
}

function sortSavings(savingsRecords) {
  return [...savingsRecords].sort((firstSavings, secondSavings) => {
    const dateCompare = secondSavings.date.localeCompare(firstSavings.date)

    if (dateCompare !== 0) {
      return dateCompare
    }

    const createdCompare = String(secondSavings.createdAt ?? '').localeCompare(
      String(firstSavings.createdAt ?? ''),
    )

    if (createdCompare !== 0) {
      return createdCompare
    }

    return (secondSavings.id ?? 0) - (firstSavings.id ?? 0)
  })
}

function buildCutoffLookup(cutoffs) {
  return new Map(cutoffs.map((cutoff) => [String(cutoff.id), cutoff]))
}

function getCutoffLabel(cutoffsById, cutoffId) {
  if (!cutoffId) {
    return 'No Cutoff'
  }

  return cutoffsById.get(String(cutoffId))?.name ?? DELETED_CUTOFF_LABEL
}

function decorateSavingsWithCutoffs(savingsRecords, cutoffs) {
  const cutoffsById = buildCutoffLookup(cutoffs)

  return savingsRecords.map((savings) => ({
    ...savings,
    cutoffName: getCutoffLabel(cutoffsById, savings.cutoffId),
  }))
}

function buildSavingsKpis(savingsRecords, currentCutoff) {
  const typeTotals = new Map()
  const currentSavings = filterRecordsByCurrentCutoff(savingsRecords, currentCutoff)
  const totals = currentSavings.reduce(
    (kpis, savings) => {
      const amount = Number(savings.amount) || 0

      kpis.totalSavings += amount
      kpis.savingsRecords += 1

      typeTotals.set(
        savings.source,
        (typeTotals.get(savings.source) ?? 0) + amount,
      )

      return kpis
    },
    {
      currentCutoffId: currentCutoff?.id ?? null,
      savingsRecords: 0,
      totalSavings: 0,
    },
  )
  const largestSavingsType =
    [...typeTotals.entries()].sort((firstType, secondType) => {
      if (secondType[1] === firstType[1]) {
        return firstType[0].localeCompare(secondType[0])
      }

      return secondType[1] - firstType[1]
    })[0]?.[0] ?? 'None'

  return {
    ...totals,
    largestSavingsType,
  }
}

export const savingsService = {
  async loadSavings(filters = EMPTY_SAVINGS_FILTERS) {
    const [savingsRecords, cutoffs] = await Promise.all([
      savingsRepository.findAll(),
      salaryCutoffRepository.findAll(),
    ])

    const filteredSavings = applySavingsFilters(savingsRecords, filters)
    return sortSavings(decorateSavingsWithCutoffs(filteredSavings, cutoffs))
  },

  async loadSalaryCutoffs() {
    return salaryCutoffRepository.findAll()
  },

  async loadSavingsKpis() {
    const [savingsRecords, currentCutoff] = await Promise.all([
      savingsRepository.findAll(),
      cutoffService.findCurrentCutoff(),
    ])

    return buildSavingsKpis(savingsRecords, currentCutoff)
  },

  async createSavings(payload) {
    const savings = normalizeSavingsPayload(payload)
    const id = await savingsRepository.create(savings)
    return savingsRepository.findById(id)
  },

  async updateSavings(id, payload) {
    const existingSavings = await savingsRepository.findById(id)

    if (!existingSavings) {
      throw new Error('Savings record not found')
    }

    const savings = normalizeSavingsPayload(payload, existingSavings)
    await savingsRepository.update(id, savings)
    return savingsRepository.findById(id)
  },

  async deleteSavings(id) {
    await savingsRepository.remove(id)
  },
}

export const savingsServiceInternals = {
  applySavingsFilters,
  buildSavingsKpis,
  decorateSavingsWithCutoffs,
  sortSavings,
}
