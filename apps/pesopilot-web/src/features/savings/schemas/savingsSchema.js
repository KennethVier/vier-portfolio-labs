import { z } from 'zod'

import { SAVINGS_SOURCES } from '../constants/savingsConstants.js'

const today = () => new Date().toISOString().slice(0, 10)

const optionalString = z.preprocess(
  (value) => (value === '' || value === undefined ? null : value),
  z.string().trim().nullable(),
)

const optionalCutoffId = z.preprocess((value) => {
  if (value === '' || value === undefined) {
    return null
  }

  if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) {
    return Number(value)
  }

  return value
}, z.union([z.string().trim(), z.number()]).nullable())

export const savingsSchema = z.object({
  amount: z.coerce.number().positive('Amount must be greater than zero'),
  source: z.enum(SAVINGS_SOURCES, {
    errorMap: () => ({ message: 'Type is required' }),
  }),
  date: z.string().trim().min(1, 'Date is required'),
  cutoffId: optionalCutoffId,
  note: optionalString,
})

export const savingsFormDefaults = {
  amount: '',
  source: '',
  date: today(),
  cutoffId: '',
  note: '',
}
