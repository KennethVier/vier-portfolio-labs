import { categoryRepository } from '@/lib/db/repositories/categoryRepository.js'
import { detectedExpenseRepository } from '@/lib/db/repositories/detectedExpenseRepository.js'

import { INBOX_STATUS } from '@/features/expense-inbox/constants/expenseInboxConstants.js'
import { expenseInboxSchema } from '@/features/expense-inbox/schemas/expenseInboxSchema.js'

import {
  MANUAL_AI_DETECTED_SOURCE,
  parseExpenseText,
} from '../utils/expenseTextParser.js'

function nowIso() {
  return new Date().toISOString()
}

async function getCategoryName(categoryId) {
  const category = await categoryRepository.findById(categoryId)
  return category?.name ?? 'Other'
}

function normalizePreviewPayload(payload) {
  return {
    amount: payload.amount,
    merchant: payload.merchant,
    note: payload.note ?? '',
    rawText: payload.rawText,
    source: MANUAL_AI_DETECTED_SOURCE,
    status: INBOX_STATUS.pending,
    suggestedCategoryId: payload.suggestedCategoryId,
    suggestedPaymentMethod: payload.suggestedPaymentMethod || null,
    transactionDate: payload.transactionDate,
  }
}

export const manualAiExpenseService = {
  parse(rawText, options = {}) {
    return parseExpenseText(rawText, options)
  },

  async loadCategories() {
    return categoryRepository.findByType('expense')
  },

  async submitToInbox(previewPayload) {
    const timestamp = nowIso()
    const parsedPayload = expenseInboxSchema.parse(
      normalizePreviewPayload(previewPayload),
    )

    const inboxRecord = {
      amount: parsedPayload.amount,
      confidence: previewPayload.confidence ?? null,
      createdAt: timestamp,
      merchant: parsedPayload.merchant,
      note: parsedPayload.note ?? null,
      rawText: parsedPayload.rawText ?? null,
      reviewedAt: null,
      source: MANUAL_AI_DETECTED_SOURCE,
      status: INBOX_STATUS.pending,
      suggestedCategoryId: parsedPayload.suggestedCategoryId,
      suggestedPaymentMethod: parsedPayload.suggestedPaymentMethod ?? null,
      transactionDate: parsedPayload.transactionDate,
      updatedAt: timestamp,
    }

    const id = await detectedExpenseRepository.create(inboxRecord)
    const createdRecord = await detectedExpenseRepository.findById(id)

    return {
      ...createdRecord,
      categoryName: await getCategoryName(createdRecord.suggestedCategoryId),
    }
  },
}
