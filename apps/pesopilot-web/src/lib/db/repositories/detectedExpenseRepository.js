import { db } from '../dexie.js'
import { STORE_NAMES } from '../schema.js'
import { createCrudRepository } from './createCrudRepository.js'

const baseRepository = createCrudRepository(STORE_NAMES.detectedExpenses)

export const detectedExpenseRepository = {
  ...baseRepository,
  findByStatus(status) {
    return db.detected_expenses.where('status').equals(status).toArray()
  },
  findByMerchant(merchant) {
    return db.detected_expenses.where('merchant').equals(merchant).toArray()
  },
}
