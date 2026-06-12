import { z } from 'zod'

import {
  CUTOFF_STATUS_VALUES,
  CUTOFF_TYPE_VALUES,
} from '../constants/cutoffConstants.js'

const today = () => new Date().toISOString().slice(0, 10)

const requiredString = (message) => z.string().trim().min(1, message)

const money = (message) =>
  z.coerce
    .number({
      invalid_type_error: message,
      required_error: message,
    })
    .min(0, message)

const optionalMoney = z.preprocess(
  (value) => (value === '' || value === undefined ? null : value),
  z.coerce.number().min(0, 'Actual income must be zero or greater').nullable(),
)

export const cutoffSchema = z
  .object({
    name: requiredString('Name is required'),
    type: z.enum(CUTOFF_TYPE_VALUES, {
      errorMap: () => ({ message: 'Type is required' }),
    }),
    startDate: requiredString('Start date is required'),
    endDate: requiredString('End date is required'),
    expectedIncome: money('Expected income must be zero or greater'),
    actualIncome: optionalMoney,
    status: z.enum(CUTOFF_STATUS_VALUES, {
      errorMap: () => ({ message: 'Status is required' }),
    }),
  })
  .refine((cutoff) => cutoff.endDate >= cutoff.startDate, {
    message: 'End date must be on or after start date',
    path: ['endDate'],
  })

export const cutoffFormDefaults = {
  name: '',
  type: 'semi_monthly',
  startDate: today(),
  endDate: today(),
  expectedIncome: '',
  actualIncome: '',
  status: 'planned',
}
