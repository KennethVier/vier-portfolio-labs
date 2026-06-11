import { db } from '../dexie.js'
import { STORE_NAMES } from '../schema.js'
import { createCrudRepository } from './createCrudRepository.js'

const baseRepository = createCrudRepository(STORE_NAMES.budgetShockAlerts)

export const budgetShockAlertRepository = {
  ...baseRepository,
  findByCutoff(cutoffId) {
    return db.budget_shock_alerts.where('cutoffId').equals(cutoffId).toArray()
  },
  findByLevel(level) {
    return db.budget_shock_alerts.where('level').equals(level).toArray()
  },
}
