import { z } from 'zod'

import { INCOME_SOURCES } from '../constants/incomeConstants.js'

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

export const incomeSchema = z.object({
  amount: z.coerce.number().positive('Amount must be greater than zero'),
  source: z.enum(INCOME_SOURCES, {
    errorMap: () => ({ message: 'Source is required' }),
  }),
  date: z.string().trim().min(1, 'Date is required'),
  cutoffId: optionalCutoffId,
  note: optionalString,
})

export const incomeFormDefaults = {
  amount: '',
  source: '',
  date: today(),
  cutoffId: '',
  note: '',
}
