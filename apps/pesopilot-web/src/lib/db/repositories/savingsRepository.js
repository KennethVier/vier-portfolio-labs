import { db } from '../dexie.js'
import { STORE_NAMES } from '../schema.js'
import { createCrudRepository } from './createCrudRepository.js'

const baseRepository = createCrudRepository(STORE_NAMES.savings)

export const savingsRepository = {
  ...baseRepository,
  findByCutoff(cutoffId) {
    return db.savings.where('cutoffId').equals(cutoffId).toArray()
  },
  findByGoal(goalId) {
    return db.savings.where('goalId').equals(goalId).toArray()
  },
  findByDateRange(startDate, endDate) {
    return db.savings.where('date').between(startDate, endDate, true, true).toArray()
  },
}
