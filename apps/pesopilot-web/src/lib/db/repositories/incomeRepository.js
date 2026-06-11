import { db } from '../dexie.js'
import { STORE_NAMES } from '../schema.js'
import { createCrudRepository } from './createCrudRepository.js'

const baseRepository = createCrudRepository(STORE_NAMES.income)

export const incomeRepository = {
  ...baseRepository,
  findByCutoff(cutoffId) {
    return db.income.where('cutoffId').equals(cutoffId).toArray()
  },
  findByDateRange(startDate, endDate) {
    return db.income.where('date').between(startDate, endDate, true, true).toArray()
  },
}
