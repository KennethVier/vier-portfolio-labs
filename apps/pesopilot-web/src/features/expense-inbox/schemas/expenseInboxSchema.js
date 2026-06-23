import { z } from 'zod'

import { PAYMENT_METHODS } from '@/features/expenses/constants/expenseConstants.js'

import { INBOX_STATUS_OPTIONS } from '../constants/expenseInboxConstants.js'

const optionalText = z.preprocess(
  (value) => (value === '' ? null : value),
  z.string().trim().nullable().optional(),
)

const optionalPaymentMethod = z.preprocess(
  (value) => (value === '' ? null : value),
  z.enum(PAYMENT_METHODS).nullable().optional(),
)

const optionalCategorySource = z.preprocess(
  (value) => (value === '' ? null : value),
  z.string().trim().nullable().optional(),
)

const optionalMerchantRuleId = z.preprocess(
  (value) => (value === '' ? null : value),
  z.union([z.coerce.number(), z.string().trim()]).nullable().optional(),
)

export const expenseInboxSchema = z.object({
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  categorySource: optionalCategorySource,
  merchant: z.string().trim().min(1, 'Merchant is required'),
  merchantRuleId: optionalMerchantRuleId,
  note: optionalText,
  rawText: optionalText,
  rememberMerchantRule: z.boolean().optional(),
  source: z.string().trim().min(1, 'Source is required'),
  status: z.enum(INBOX_STATUS_OPTIONS),
  suggestedCategoryId: z.string().trim().min(1, 'Category is required'),
  suggestedPaymentMethod: optionalPaymentMethod,
  transactionDate: z.string().trim().min(1, 'Date is required'),
})

export const expenseInboxFormDefaults = {
  amount: '',
  categorySource: '',
  merchant: '',
  merchantRuleId: '',
  note: '',
  rawText: '',
  rememberMerchantRule: true,
  source: 'manual_input',
  status: 'PENDING',
  suggestedCategoryId: '',
  suggestedPaymentMethod: '',
  transactionDate: new Date().toISOString().slice(0, 10),
}
