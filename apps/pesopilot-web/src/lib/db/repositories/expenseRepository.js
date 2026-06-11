import { db } from '../dexie.js'
import { STORE_NAMES } from '../schema.js'
import { createCrudRepository } from './createCrudRepository.js'

const baseRepository = createCrudRepository(STORE_NAMES.expenses)

export const expenseRepository = {
  ...baseRepository,
  findByCutoff(cutoffId) {
    return db.expenses.where('cutoffId').equals(cutoffId).toArray()
  },
  findByDateRange(startDate, endDate) {
    return db.expenses.where('date').between(startDate, endDate, true, true).toArray()
  },
  findByCategory(categoryId) {
    return db.expenses.where('categoryId').equals(categoryId).toArray()
  },
}
