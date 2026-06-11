import { db } from '../dexie.js'
import { STORE_NAMES } from '../schema.js'
import { createCrudRepository } from './createCrudRepository.js'

const baseRepository = createCrudRepository(STORE_NAMES.budgets)

export const budgetRepository = {
  ...baseRepository,
  findByCutoff(cutoffId) {
    return db.budgets.where('cutoffId').equals(cutoffId).toArray()
  },
  findByCategory(categoryId) {
    return db.budgets.where('categoryId').equals(categoryId).toArray()
  },
}
