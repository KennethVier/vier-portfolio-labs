import { incomeRepository } from '@/lib/db/repositories/incomeRepository.js'
import { salaryCutoffRepository } from '@/lib/db/repositories/salaryCutoffRepository.js'

import { EMPTY_INCOME_FILTERS } from '../constants/incomeConstants.js'
import { incomeSchema } from '../schemas/incomeSchema.js'

export const DELETED_CUTOFF_LABEL = 'Deleted Cutoff'

function nowIso() {
  return new Date().toISOString()
}

function normalizeIncomePayload(payload, existingIncome = null) {
  const parsedIncome = incomeSchema.parse(payload)
  const timestamp = nowIso()

  return {
    amount: parsedIncome.amount,
    source: parsedIncome.source,
    date: parsedIncome.date,
    cutoffId: parsedIncome.cutoffId,
    note: parsedIncome.note,
    createdAt: existingIncome?.createdAt ?? timestamp,
    updatedAt: timestamp,
  }
}

function normalizeSearchText(value) {
  return String(value ?? '').trim().toLowerCase()
}

function isWithinDateRange(income, filters) {
  if (filters.startDate && income.date < filters.startDate) {
    return false
  }

  if (filters.endDate && income.date > filters.endDate) {
    return false
  }

  return true
}

function matchesSearch(income, searchText) {
  if (!searchText) {
    return true
  }

  return [income.source, income.note].some((value) =>
    normalizeSearchText(value).includes(searchText),
  )
}

function applyIncomeFilters(incomeRecords, filters = EMPTY_INCOME_FILTERS) {
  const searchText = normalizeSearchText(filters.search)

  return incomeRecords.filter((income) => {
    if (filters.cutoffId && String(income.cutoffId) !== String(filters.cutoffId)) {
      return false
    }

    if (filters.source && income.source !== filters.source) {
      return false
    }

    if (!isWithinDateRange(income, filters)) {
      return false
    }

    return matchesSearch(income, searchText)
  })
}

function sortIncome(incomeRecords) {
  return [...incomeRecords].sort((firstIncome, secondIncome) => {
    const dateCompare = secondIncome.date.localeCompare(firstIncome.date)

    if (dateCompare !== 0) {
      return dateCompare
    }

    const createdCompare = String(secondIncome.createdAt ?? '').localeCompare(
      String(firstIncome.createdAt ?? ''),
    )

    if (createdCompare !== 0) {
      return createdCompare
    }

    return (secondIncome.id ?? 0) - (firstIncome.id ?? 0)
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

function decorateIncomeWithCutoffs(incomeRecords, cutoffs) {
  const cutoffsById = buildCutoffLookup(cutoffs)

  return incomeRecords.map((income) => ({
    ...income,
    cutoffName: getCutoffLabel(cutoffsById, income.cutoffId),
  }))
}

export const incomeService = {
  async loadIncome(filters = EMPTY_INCOME_FILTERS) {
    const [incomeRecords, cutoffs] = await Promise.all([
      incomeRepository.findAll(),
      salaryCutoffRepository.findAll(),
    ])

    const filteredIncome = applyIncomeFilters(incomeRecords, filters)
    return sortIncome(decorateIncomeWithCutoffs(filteredIncome, cutoffs))
  },

  async loadSalaryCutoffs() {
    return salaryCutoffRepository.findAll()
  },

  async createIncome(payload) {
    const income = normalizeIncomePayload(payload)
    const id = await incomeRepository.create(income)
    return incomeRepository.findById(id)
  },

  async updateIncome(id, payload) {
    const existingIncome = await incomeRepository.findById(id)

    if (!existingIncome) {
      throw new Error('Income not found')
    }

    const income = normalizeIncomePayload(payload, existingIncome)
    await incomeRepository.update(id, income)
    return incomeRepository.findById(id)
  },

  async deleteIncome(id) {
    await incomeRepository.remove(id)
  },
}

export const incomeServiceInternals = {
  applyIncomeFilters,
  decorateIncomeWithCutoffs,
  sortIncome,
}
