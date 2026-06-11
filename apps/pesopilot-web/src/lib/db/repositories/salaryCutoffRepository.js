import { db } from '../dexie.js'
import { STORE_NAMES } from '../schema.js'
import { createCrudRepository } from './createCrudRepository.js'

const baseRepository = createCrudRepository(STORE_NAMES.salaryCutoffs)

export const salaryCutoffRepository = {
  ...baseRepository,
  findActive() {
    return db.salary_cutoffs.where('status').equals('active').first()
  },
  findByDateRange(startDate, endDate) {
    return db.salary_cutoffs
      .where('startDate')
      .between(startDate, endDate, true, true)
      .toArray()
  },
}
