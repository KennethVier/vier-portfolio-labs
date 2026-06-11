import { categoryRepository } from '@/lib/db/repositories/categoryRepository.js'
import { expenseRepository } from '@/lib/db/repositories/expenseRepository.js'
import { salaryCutoffRepository } from '@/lib/db/repositories/salaryCutoffRepository.js'

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

  async createExpense(payload) {
    const expense = normalizeExpensePayload(payload)
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
