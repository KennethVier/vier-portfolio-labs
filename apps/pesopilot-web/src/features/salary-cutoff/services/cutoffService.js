import { expenseRepository } from '@/lib/db/repositories/expenseRepository.js'
import { salaryCutoffRepository } from '@/lib/db/repositories/salaryCutoffRepository.js'

import { cutoffSchema } from '../schemas/cutoffSchema.js'
import { generateSalaryCutoffCycle } from './cutoffCycle.js'

function nowIso() {
  return new Date().toISOString()
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10)
}

function sortCutoffs(cutoffs) {
  return [...cutoffs].sort((firstCutoff, secondCutoff) => {
    if (firstCutoff.startDate === secondCutoff.startDate) {
      return (secondCutoff.id ?? 0) - (firstCutoff.id ?? 0)
    }

    return secondCutoff.startDate.localeCompare(firstCutoff.startDate)
  })
}

function rangesOverlap(firstRange, secondRange) {
  return (
    firstRange.startDate <= secondRange.endDate &&
    firstRange.endDate >= secondRange.startDate
  )
}

function normalizeCutoffPayload(payload, existingCutoff = null) {
  const parsedCutoff = cutoffSchema.parse(payload)
  const timestamp = nowIso()
  const referenceDate =
    parsedCutoff.type === 'custom'
      ? parsedCutoff.startDate
      : parsedCutoff.referenceDate ?? existingCutoff?.startDate ?? todayIsoDate()
  const generatedCycle =
    parsedCutoff.type === 'custom'
      ? {
          startDate: parsedCutoff.startDate,
          endDate: parsedCutoff.endDate,
        }
      : generateSalaryCutoffCycle({
          payday1: parsedCutoff.payday1,
          payday2: parsedCutoff.payday2,
          referenceDate,
          type: parsedCutoff.type,
        })

  return {
    name: parsedCutoff.name,
    type: parsedCutoff.type,
    payday1: parsedCutoff.type === 'custom' ? null : parsedCutoff.payday1,
    payday2: parsedCutoff.type === 'semi_monthly' ? parsedCutoff.payday2 : null,
    startDate: generatedCycle.startDate,
    endDate: generatedCycle.endDate,
    expectedIncome: parsedCutoff.expectedIncome,
    status: parsedCutoff.status,
    createdAt: existingCutoff?.createdAt ?? timestamp,
    updatedAt: timestamp,
  }
}

async function ensureNoDateOverlap(cutoff, ignoredId = null) {
  const existingCutoffs = await salaryCutoffRepository.findAll()
  const overlappingCutoff = existingCutoffs.find(
    (existingCutoff) =>
      existingCutoff.id !== ignoredId && rangesOverlap(cutoff, existingCutoff),
  )

  if (overlappingCutoff) {
    throw new Error('Cutoff dates overlap an existing cutoff')
  }
}

async function deactivateOtherActiveCutoffs(activeCutoffId = null) {
  const cutoffs = await salaryCutoffRepository.findAll()
  const activeCutoffs = cutoffs.filter(
    (cutoff) => cutoff.id !== activeCutoffId && cutoff.status === 'active',
  )

  await Promise.all(
    activeCutoffs.map((cutoff) =>
      salaryCutoffRepository.update(cutoff.id, {
        status: 'planned',
        updatedAt: nowIso(),
      }),
    ),
  )
}

function findCurrentCutoffFromList(cutoffs, date = todayIsoDate()) {
  const activeCutoffs = sortCutoffs(
    cutoffs.filter((cutoff) => cutoff.status === 'active'),
  )

  if (activeCutoffs.length > 0) {
    return activeCutoffs[0]
  }

  const matchingCutoffs = sortCutoffs(
    cutoffs.filter(
      (cutoff) =>
        cutoff.status !== 'closed' &&
        cutoff.startDate <= date &&
        cutoff.endDate >= date,
    ),
  )

  return matchingCutoffs[0] ?? null
}

export const cutoffService = {
  async loadCutoffs() {
    const cutoffs = sortCutoffs(await salaryCutoffRepository.findAll())

    return {
      cutoffs,
      currentCutoff: findCurrentCutoffFromList(cutoffs),
    }
  },

  async createCutoff(payload) {
    const cutoff = normalizeCutoffPayload(payload)
    await ensureNoDateOverlap(cutoff)

    if (cutoff.status === 'active') {
      await deactivateOtherActiveCutoffs()
    }

    const id = await salaryCutoffRepository.create(cutoff)
    return salaryCutoffRepository.findById(id)
  },

  async updateCutoff(id, payload) {
    const existingCutoff = await salaryCutoffRepository.findById(id)

    if (!existingCutoff) {
      throw new Error('Salary cutoff not found')
    }

    const cutoff = normalizeCutoffPayload(payload, existingCutoff)
    await ensureNoDateOverlap(cutoff, id)

    if (cutoff.status === 'active') {
      await deactivateOtherActiveCutoffs(id)
    }

    await salaryCutoffRepository.update(id, cutoff)
    return salaryCutoffRepository.findById(id)
  },

  async deleteCutoff(id) {
    await salaryCutoffRepository.remove(id)
  },

  async markCutoffActive(id) {
    const cutoff = await salaryCutoffRepository.findById(id)

    if (!cutoff) {
      throw new Error('Salary cutoff not found')
    }

    await deactivateOtherActiveCutoffs(id)
    await salaryCutoffRepository.update(id, {
      status: 'active',
      updatedAt: nowIso(),
    })

    return salaryCutoffRepository.findById(id)
  },

  async closeCutoff(id) {
    const cutoff = await salaryCutoffRepository.findById(id)

    if (!cutoff) {
      throw new Error('Salary cutoff not found')
    }

    await salaryCutoffRepository.update(id, {
      status: 'closed',
      updatedAt: nowIso(),
    })

    return salaryCutoffRepository.findById(id)
  },

  async findCurrentCutoff(date = todayIsoDate()) {
    return findCurrentCutoffFromList(await salaryCutoffRepository.findAll(), date)
  },

  async assignExpensesToCutoff(cutoffId) {
    const cutoff = await salaryCutoffRepository.findById(cutoffId)

    if (!cutoff) {
      throw new Error('Salary cutoff not found')
    }

    const matchingExpenses = await expenseRepository.findByDateRange(
      cutoff.startDate,
      cutoff.endDate,
    )
    const unassignedExpenses = matchingExpenses.filter((expense) => !expense.cutoffId)
    const timestamp = nowIso()

    await Promise.all(
      unassignedExpenses.map((expense) =>
        expenseRepository.update(expense.id, {
          cutoffId,
          updatedAt: timestamp,
        }),
      ),
    )

    return unassignedExpenses.length
  },
}

export const cutoffServiceInternals = {
  findCurrentCutoffFromList,
}
