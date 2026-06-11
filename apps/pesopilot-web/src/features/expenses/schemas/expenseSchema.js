import { z } from 'zod'

import { EMOTION_TAGS, EXPENSE_SOURCE_MANUAL, PAYMENT_METHODS } from '../constants/expenseConstants.js'

const optionalText = z.preprocess(
  (value) => (value === '' ? null : value),
  z.string().trim().nullable().optional(),
)

const optionalSelect = (allowedValues) =>
  z.preprocess(
    (value) => (value === '' ? null : value),
    z.enum(allowedValues).nullable().optional(),
  )

const optionalCutoffId = z.preprocess((value) => {
  if (value === '' || value === null || value === undefined) {
    return null
  }

  return Number(value)
}, z.number().int().positive().nullable().optional())

export const expenseSchema = z.object({
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  merchant: optionalText,
  categoryId: z.string().trim().min(1, 'Category is required'),
  paymentMethod: optionalSelect(PAYMENT_METHODS),
  date: z.string().trim().min(1, 'Date is required'),
  cutoffId: optionalCutoffId,
  emotionTag: optionalSelect(EMOTION_TAGS),
  note: optionalText,
  source: z.string().trim().min(1, 'Source is required').default(EXPENSE_SOURCE_MANUAL),
})

export const expenseFormDefaults = {
  amount: '',
  merchant: '',
  categoryId: '',
  paymentMethod: '',
  date: new Date().toISOString().slice(0, 10),
  cutoffId: '',
  emotionTag: '',
  note: '',
  source: EXPENSE_SOURCE_MANUAL,
}
