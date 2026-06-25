import { categoryRepository } from '@/lib/db/repositories/categoryRepository.js'
import { expenseRepository } from '@/lib/db/repositories/expenseRepository.js'
import { salaryCutoffRepository } from '@/lib/db/repositories/salaryCutoffRepository.js'
import { filterRecordsByCurrentCutoff } from '@/features/shared/utils/currentCutoffFilters.js'
import { cutoffService } from '@/features/salary-cutoff/services/cutoffService.js'

import { EMPTY_EXPENSE_FILTERS, EXPENSE_SOURCE_MANUAL } from '../constants/expenseConstants.js'
import { expenseSchema } from '../schemas/expenseSchema.js'

function nowIso() {
  return new Date().toISOString()
}

function normalizeExpensePayload(payload, existingExpense = null) {
  const parsedExpense = expenseSchema.parse({
    source: EXPENSE_SOURCE_MANUAL,
    ...payload,
  })
  const timestamp = nowIso()

  return {
    amount: parsedExpense.amount,
    merchant: parsedExpense.merchant ?? null,
    categoryId: parsedExpense.categoryId,
    paymentMethod: parsedExpense.paymentMethod ?? null,
    date: parsedExpense.date,
    cutoffId: parsedExpense.cutoffId ?? null,
    emotionTag: parsedExpense.emotionTag ?? null,
    note: parsedExpense.note ?? null,
    source: parsedExpense.source,
    createdAt: existingExpense?.createdAt ?? timestamp,
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

function isWithinDateRange(expense, filters) {
  if (filters.startDate && expense.date < filters.startDate) {
    return false
  }

  if (filters.endDate && expense.date > filters.endDate) {
    return false
  }

  return true
}

function normalizeSearchText(value) {
  return String(value ?? '').trim().toLowerCase()
}

function matchesSearch(expense, searchText, categoriesById) {
  if (!searchText) {
    return true
  }

  const categoryName = categoriesById.get(expense.categoryId)?.name
  const searchableValues = [
    expense.merchant,
    expense.note,
    expense.paymentMethod,
    categoryName,
  ]

  return searchableValues.some((value) =>
    normalizeSearchText(value).includes(searchText),
  )
}

function applyExpenseFilters(expenses, filters = EMPTY_EXPENSE_FILTERS, categories = []) {
  const searchText = normalizeSearchText(filters.search)
  const categoriesById = new Map(
    categories.map((category) => [category.id, category]),
  )

  return expenses.filter((expense) => {
    if (filters.categoryId && expense.categoryId !== filters.categoryId) {
      return false
    }

    if (filters.paymentMethod && expense.paymentMethod !== filters.paymentMethod) {
      return false
    }

    if (!isWithinDateRange(expense, filters)) {
      return false
    }

    return matchesSearch(expense, searchText, categoriesById)
  })
}

function sortExpenses(expenses) {
  return [...expenses].sort((firstExpense, secondExpense) => {
    if (firstExpense.date === secondExpense.date) {
      return (secondExpense.id ?? 0) - (firstExpense.id ?? 0)
    }

    return secondExpense.date.localeCompare(firstExpense.date)
  })
}

function buildExpenseKpis(expenses, categories, currentCutoff) {
  const categoriesById = new Map(
    categories.map((category) => [category.id, category]),
  )
  const categoryTotals = new Map()
  const currentExpenses = filterRecordsByCurrentCutoff(expenses, currentCutoff)
  const totalExpenses = currentExpenses.reduce((total, expense) => {
    const amount = Number(expense.amount) || 0
    const categoryName =
      categoriesById.get(expense.categoryId)?.name ?? 'Uncategorized'

    categoryTotals.set(categoryName, (categoryTotals.get(categoryName) ?? 0) + amount)

    return total + amount
  }, 0)
  const transactionCount = currentExpenses.length
  const largestCategory =
    [...categoryTotals.entries()].sort((firstCategory, secondCategory) => {
      if (secondCategory[1] === firstCategory[1]) {
        return firstCategory[0].localeCompare(secondCategory[0])
      }

      return secondCategory[1] - firstCategory[1]
    })[0]?.[0] ?? 'None'

  return {
    averageExpense: transactionCount === 0 ? 0 : totalExpenses / transactionCount,
    currentCutoffId: currentCutoff?.id ?? null,
    largestCategory,
    totalExpenses,
    transactionCount,
  }
}

export const expenseService = {
  async loadExpenses(filters = EMPTY_EXPENSE_FILTERS) {
    const [expenses, categories] = await Promise.all([
      expenseRepository.findAll(),
      categoryRepository.findAll(),
    ])

    return sortExpenses(applyExpenseFilters(expenses, filters, categories))
  },

  async loadCategories() {
    return categoryRepository.findByType('expense')
  },

  async loadSalaryCutoffs() {
    return salaryCutoffRepository.findAll()
  },

  async loadExpenseKpis() {
    const [expenses, categories, currentCutoff] = await Promise.all([
      expenseRepository.findAll(),
      categoryRepository.findAll(),
      cutoffService.findCurrentCutoff(),
    ])

    return buildExpenseKpis(expenses, categories, currentCutoff)
  },

  async createExpense(payload) {
    const expense = normalizeExpensePayload({
      ...payload,
      cutoffId: await getDefaultCutoffId(payload.cutoffId),
    })
    const id = await expenseRepository.create(expense)
    return expenseRepository.findById(id)
  },

  async updateExpense(id, payload) {
    const existingExpense = await expenseRepository.findById(id)

    if (!existingExpense) {
      throw new Error('Expense not found')
    }

    const expense = normalizeExpensePayload(payload, existingExpense)
    await expenseRepository.update(id, expense)
    return expenseRepository.findById(id)
  },

  async deleteExpense(id) {
    await expenseRepository.remove(id)
  },
}

export const expenseServiceInternals = {
  applyExpenseFilters,
  buildExpenseKpis,
  sortExpenses,
}
