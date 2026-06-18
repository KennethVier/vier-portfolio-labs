import { z } from 'zod'

import {
  CUTOFF_STATUS_VALUES,
  CUTOFF_TYPE_VALUES,
} from '../constants/cutoffConstants.js'

const today = () => new Date().toISOString().slice(0, 10)

const requiredString = (message) => z.string().trim().min(1, message)
const optionalDateString = z.preprocess(
  (value) => (value === '' ? null : value),
  z.string().trim().nullable().optional(),
)
const optionalPayday = z.preprocess((value) => {
  if (value === '' || value === null || value === undefined) {
    return null
  }

  return Number(value)
}, z.number().int().min(1, 'Payday must be from 1 to 31').max(31, 'Payday must be from 1 to 31').nullable().optional())

const money = (message) =>
  z.coerce
    .number({
      invalid_type_error: message,
      required_error: message,
    })
    .min(0, message)

export const cutoffSchema = z
  .object({
    name: requiredString('Name is required'),
    type: z.enum(CUTOFF_TYPE_VALUES, {
      errorMap: () => ({ message: 'Type is required' }),
    }),
    payday1: optionalPayday,
    payday2: optionalPayday,
    referenceDate: optionalDateString,
    startDate: optionalDateString,
    endDate: optionalDateString,
    expectedIncome: money('Expected income must be zero or greater'),
    status: z.enum(CUTOFF_STATUS_VALUES, {
      errorMap: () => ({ message: 'Status is required' }),
    }),
  })
  .superRefine((cutoff, context) => {
    if (cutoff.type === 'semi_monthly') {
      if (!cutoff.payday1) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Payday 1 is required',
          path: ['payday1'],
        })
      }

      if (!cutoff.payday2) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Payday 2 is required',
          path: ['payday2'],
        })
      }

      if (cutoff.payday1 && cutoff.payday2 && cutoff.payday1 >= cutoff.payday2) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Payday 1 must be less than Payday 2',
          path: ['payday2'],
        })
      }
    }

    if (cutoff.type === 'monthly' && !cutoff.payday1) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Payday is required',
        path: ['payday1'],
      })
    }

    if (cutoff.type === 'custom') {
      if (!cutoff.startDate) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Start date is required',
          path: ['startDate'],
        })
      }

      if (!cutoff.endDate) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'End date is required',
          path: ['endDate'],
        })
      }

      if (cutoff.startDate && cutoff.endDate && cutoff.endDate < cutoff.startDate) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'End date must be on or after start date',
          path: ['endDate'],
        })
      }
    }
  })
  .transform((cutoff) => ({
    ...cutoff,
    payday1: cutoff.type === 'custom' ? null : cutoff.payday1,
    payday2: cutoff.type === 'semi_monthly' ? cutoff.payday2 : null,
    startDate: cutoff.type === 'custom' ? cutoff.startDate : null,
    endDate: cutoff.type === 'custom' ? cutoff.endDate : null,
  }))

export const customCutoffDateSchema = z.object({
  startDate: requiredString('Start date is required'),
  endDate: requiredString('End date is required'),
}).refine((cutoff) => cutoff.endDate >= cutoff.startDate, {
    message: 'End date must be on or after start date',
    path: ['endDate'],
  })

export const cutoffFormDefaults = {
  name: '',
  type: 'semi_monthly',
  payday1: '',
  payday2: '',
  startDate: today(),
  endDate: today(),
  expectedIncome: '',
  status: 'planned',
}
