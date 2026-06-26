import { salaryCutoffRepository } from '@/lib/db/repositories/salaryCutoffRepository.js'
import { savingsGoalRepository } from '@/lib/db/repositories/savingsGoalRepository.js'
import { savingsRepository } from '@/lib/db/repositories/savingsRepository.js'
import { filterRecordsByCurrentCutoff } from '@/features/shared/utils/currentCutoffFilters.js'
import { cutoffService } from '@/features/salary-cutoff/services/cutoffService.js'

import { EMPTY_SAVINGS_FILTERS } from '../constants/savingsConstants.js'
import { savingsGoalSchema } from '../schemas/savingsGoalSchema.js'
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
    goalId: parsedSavings.goalId,
    note: parsedSavings.note,
    createdAt: existingSavings?.createdAt ?? timestamp,
    updatedAt: timestamp,
  }
}

async function getDefaultCutoffId(payloadCutoffId) {
  if (payloadCutoffId) {
    return payloadCutoffId
  }

  const currentCutoff = await cutoffService.findCurrentCutoff()
  return currentCutoff?.id ?? null
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

    if (filters.goalId && String(savings.goalId) !== String(filters.goalId)) {
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

function buildGoalLookup(goals) {
  return new Map(goals.map((goal) => [String(goal.id), goal]))
}

function getGoalLabel(goalsById, goalId) {
  if (!goalId) {
    return 'General Savings'
  }

  return goalsById.get(String(goalId))?.name ?? 'Deleted Goal'
}

function decorateSavingsWithGoals(savingsRecords, goals) {
  const goalsById = buildGoalLookup(goals)

  return savingsRecords.map((savings) => ({
    ...savings,
    goalName: getGoalLabel(goalsById, savings.goalId),
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

function normalizeGoalPayload(payload, existingGoal = null) {
  const parsedGoal = savingsGoalSchema.parse(payload)
  const timestamp = nowIso()

  return {
    name: parsedGoal.name,
    targetAmount: parsedGoal.targetAmount,
    targetDate: parsedGoal.targetDate,
    priority: parsedGoal.priority,
    status: parsedGoal.status,
    note: parsedGoal.note,
    createdAt: existingGoal?.createdAt ?? timestamp,
    updatedAt: timestamp,
  }
}

function priorityRank(priority) {
  return {
    high: 1,
    medium: 2,
    low: 3,
  }[priority] ?? 4
}

function getCompletionPercent(totalSaved, targetAmount) {
  if (!targetAmount) {
    return null
  }

  return Math.min(100, Math.round((totalSaved / targetAmount) * 100))
}

function buildGoalSummaries(goals, savingsRecords) {
  const savingsByGoalId = savingsRecords.reduce((groups, savings) => {
    if (!savings.goalId) {
      return groups
    }

    const key = String(savings.goalId)
    groups.set(key, [...(groups.get(key) ?? []), savings])
    return groups
  }, new Map())

  return goals
    .map((goal) => {
      const contributions = savingsByGoalId.get(String(goal.id)) ?? []
      const totalSaved = contributions.reduce(
        (sum, savings) => sum + (Number(savings.amount) || 0),
        0,
      )
      const latestContributionDate =
        contributions
          .map((savings) => savings.date)
          .filter(Boolean)
          .sort((firstDate, secondDate) => secondDate.localeCompare(firstDate))[0] ??
        null
      const targetAmount = Number(goal.targetAmount) || null
      const progress = getCompletionPercent(totalSaved, targetAmount)

      return {
        ...goal,
        contributionCount: contributions.length,
        goalMet: Boolean(targetAmount && totalSaved >= targetAmount),
        latestContributionDate,
        progress,
        remainingAmount: targetAmount ? Math.max(0, targetAmount - totalSaved) : null,
        totalSaved,
      }
    })
    .sort((firstGoal, secondGoal) => {
      if (firstGoal.status !== secondGoal.status) {
        return firstGoal.status === 'active' ? -1 : 1
      }

      const priorityCompare =
        priorityRank(firstGoal.priority) - priorityRank(secondGoal.priority)

      if (priorityCompare !== 0) {
        return priorityCompare
      }

      const firstTarget = firstGoal.targetDate ?? '9999-12-31'
      const secondTarget = secondGoal.targetDate ?? '9999-12-31'
      const targetCompare = firstTarget.localeCompare(secondTarget)

      if (targetCompare !== 0) {
        return targetCompare
      }

      const firstProgress = firstGoal.progress ?? -1
      const secondProgress = secondGoal.progress ?? -1

      if (secondProgress !== firstProgress) {
        return secondProgress - firstProgress
      }

      return String(secondGoal.updatedAt ?? '').localeCompare(
        String(firstGoal.updatedAt ?? ''),
      )
    })
}

export const savingsService = {
  async loadSavings(filters = EMPTY_SAVINGS_FILTERS) {
    const [savingsRecords, cutoffs, goals] = await Promise.all([
      savingsRepository.findAll(),
      salaryCutoffRepository.findAll(),
      savingsGoalRepository.findAll(),
    ])

    const filteredSavings = applySavingsFilters(savingsRecords, filters)
    return sortSavings(
      decorateSavingsWithGoals(decorateSavingsWithCutoffs(filteredSavings, cutoffs), goals),
    )
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

  async loadSavingsGoals() {
    const [goals, savingsRecords] = await Promise.all([
      savingsGoalRepository.findAll(),
      savingsRepository.findAll(),
    ])

    return buildGoalSummaries(
      goals.filter((goal) => goal.status !== 'archived'),
      savingsRecords,
    )
  },

  async createSavingsGoal(payload) {
    const goal = normalizeGoalPayload(payload)
    const id = await savingsGoalRepository.create(goal)
    return savingsGoalRepository.findById(id)
  },

  async updateSavingsGoal(id, payload) {
    const existingGoal = await savingsGoalRepository.findById(id)

    if (!existingGoal) {
      throw new Error('Savings goal not found')
    }

    const goal = normalizeGoalPayload(payload, existingGoal)
    await savingsGoalRepository.update(id, goal)
    return savingsGoalRepository.findById(id)
  },

  async archiveSavingsGoal(id) {
    const existingGoal = await savingsGoalRepository.findById(id)

    if (!existingGoal) {
      throw new Error('Savings goal not found')
    }

    await savingsGoalRepository.update(id, {
      status: 'archived',
      updatedAt: nowIso(),
    })

    return savingsGoalRepository.findById(id)
  },

  async deleteSavingsGoal(id) {
    const contributions = await savingsRepository.findByGoal(id)

    if (contributions.length > 0) {
      throw new Error('Savings goals with contributions cannot be deleted. Archive the goal instead.')
    }

    await savingsGoalRepository.remove(id)
  },

  async createSavings(payload) {
    const savings = normalizeSavingsPayload({
      ...payload,
      cutoffId: await getDefaultCutoffId(payload.cutoffId),
    })
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
  buildGoalSummaries,
  buildSavingsKpis,
  decorateSavingsWithGoals,
  decorateSavingsWithCutoffs,
  sortSavings,
}
