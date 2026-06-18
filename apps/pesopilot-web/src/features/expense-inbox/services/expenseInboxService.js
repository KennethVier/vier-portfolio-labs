import { categoryRepository } from '@/lib/db/repositories/categoryRepository.js'
import { detectedExpenseRepository } from '@/lib/db/repositories/detectedExpenseRepository.js'

import { expenseService } from '@/features/expenses/services/expenseService.js'

import {
  EMPTY_INBOX_FILTERS,
  INBOX_STATUS,
} from '../constants/expenseInboxConstants.js'
import { expenseInboxSchema } from '../schemas/expenseInboxSchema.js'

function nowIso() {
  return new Date().toISOString()
}

function todayDate() {
  return new Date().toISOString().slice(0, 10)
}

function getRecordDate(record) {
  return record.transactionDate ?? record.createdAt?.slice(0, 10) ?? todayDate()
}

function normalizeSearchText(value) {
  return String(value ?? '').trim().toLowerCase()
}

function normalizeInboxPayload(payload, existingRecord = null) {
  const timestamp = nowIso()
  const parsed = expenseInboxSchema.parse({
    rawText: '',
    status: existingRecord?.status ?? INBOX_STATUS.pending,
    ...payload,
  })

  return {
    amount: parsed.amount,
    confidence: existingRecord?.confidence ?? payload.confidence ?? null,
    createdAt: existingRecord?.createdAt ?? timestamp,
    merchant: parsed.merchant,
    note: parsed.note ?? null,
    rawText: parsed.rawText ?? null,
    reviewedAt: existingRecord?.reviewedAt ?? null,
    source: parsed.source,
    status: parsed.status,
    suggestedCategoryId: parsed.suggestedCategoryId,
    suggestedPaymentMethod: parsed.suggestedPaymentMethod ?? null,
    transactionDate: parsed.transactionDate,
    updatedAt: timestamp,
  }
}

function decorateRecord(record, categoriesById) {
  const categoryId = record.suggestedCategoryId ?? record.category ?? ''

  return {
    ...record,
    categoryName: categoriesById.get(categoryId)?.name ?? 'Uncategorized',
    suggestedCategoryId: categoryId,
    transactionDate: getRecordDate(record),
  }
}

function matchesFilters(record, filters) {
  if (filters.status && record.status !== filters.status) {
    return false
  }

  if (filters.categoryId && record.suggestedCategoryId !== filters.categoryId) {
    return false
  }

  if (filters.startDate && record.transactionDate < filters.startDate) {
    return false
  }

  if (filters.endDate && record.transactionDate > filters.endDate) {
    return false
  }

  const searchText = normalizeSearchText(filters.search)

  if (!searchText) {
    return true
  }

  return [
    record.merchant,
    record.categoryName,
    record.note,
    record.rawText,
    record.source,
    record.suggestedPaymentMethod,
  ].some((value) => normalizeSearchText(value).includes(searchText))
}

function sortInboxRecords(records) {
  return [...records].sort((firstRecord, secondRecord) => {
    if (firstRecord.transactionDate !== secondRecord.transactionDate) {
      return secondRecord.transactionDate.localeCompare(firstRecord.transactionDate)
    }

    if ((firstRecord.createdAt ?? '') !== (secondRecord.createdAt ?? '')) {
      return (secondRecord.createdAt ?? '').localeCompare(firstRecord.createdAt ?? '')
    }

    return (secondRecord.id ?? 0) - (firstRecord.id ?? 0)
  })
}

function buildKpis(records) {
  const today = todayDate()

  return {
    approvedToday: records.filter(
      (record) =>
        record.status === INBOX_STATUS.approved &&
        record.reviewedAt?.slice(0, 10) === today,
    ).length,
    pending: records.filter((record) => record.status === INBOX_STATUS.pending).length,
    rejectedToday: records.filter(
      (record) =>
        record.status === INBOX_STATUS.rejected &&
        record.reviewedAt?.slice(0, 10) === today,
    ).length,
    total: records.length,
  }
}

async function loadCategoriesById() {
  const categories = await categoryRepository.findByType('expense')
  const categoriesById = new Map(
    categories.map((category) => [category.id, category]),
  )

  return { categories, categoriesById }
}

export const expenseInboxService = {
  async loadInbox(filters = EMPTY_INBOX_FILTERS) {
    const [records, categoryResult] = await Promise.all([
      detectedExpenseRepository.findAll(),
      loadCategoriesById(),
    ])

    const decoratedRecords = records.map((record) =>
      decorateRecord(record, categoryResult.categoriesById),
    )

    return {
      categories: categoryResult.categories,
      kpis: buildKpis(decoratedRecords),
      records: sortInboxRecords(
        decoratedRecords.filter((record) => matchesFilters(record, filters)),
      ),
    }
  },

  async loadCategories() {
    return categoryRepository.findByType('expense')
  },

  async updateInboxRecord(id, payload) {
    const existingRecord = await detectedExpenseRepository.findById(id)

    if (!existingRecord) {
      throw new Error('Inbox record not found')
    }

    if (existingRecord.status !== INBOX_STATUS.pending) {
      throw new Error('Only pending inbox records can be edited')
    }

    const normalizedRecord = normalizeInboxPayload(payload, existingRecord)
    await detectedExpenseRepository.update(id, normalizedRecord)

    return detectedExpenseRepository.findById(id)
  },

  async approveInboxRecord(id, payload) {
    const existingRecord = await detectedExpenseRepository.findById(id)

    if (!existingRecord) {
      throw new Error('Inbox record not found')
    }

    if (existingRecord.status !== INBOX_STATUS.pending) {
      throw new Error('Only pending inbox records can be approved')
    }

    const normalizedRecord = normalizeInboxPayload(
      {
        ...existingRecord,
        ...payload,
        status: INBOX_STATUS.pending,
      },
      existingRecord,
    )

    const expense = await expenseService.createExpense({
      amount: normalizedRecord.amount,
      categoryId: normalizedRecord.suggestedCategoryId,
      date: normalizedRecord.transactionDate,
      merchant: normalizedRecord.merchant,
      note: normalizedRecord.note ?? normalizedRecord.rawText ?? null,
      paymentMethod: normalizedRecord.suggestedPaymentMethod ?? null,
      source: 'expense_inbox',
    })

    const timestamp = nowIso()

    await detectedExpenseRepository.update(id, {
      ...normalizedRecord,
      reviewedAt: timestamp,
      status: INBOX_STATUS.approved,
      updatedAt: timestamp,
    })

    return {
      expense,
      inboxRecord: await detectedExpenseRepository.findById(id),
    }
  },

  async rejectInboxRecord(id) {
    const existingRecord = await detectedExpenseRepository.findById(id)

    if (!existingRecord) {
      throw new Error('Inbox record not found')
    }

    if (existingRecord.status !== INBOX_STATUS.pending) {
      throw new Error('Only pending inbox records can be rejected')
    }

    const timestamp = nowIso()

    await detectedExpenseRepository.update(id, {
      reviewedAt: timestamp,
      status: INBOX_STATUS.rejected,
      updatedAt: timestamp,
    })

    return detectedExpenseRepository.findById(id)
  },
}
