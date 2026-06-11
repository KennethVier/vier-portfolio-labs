import { db } from '../dexie.js'
import { STORE_NAMES } from '../schema.js'
import { createCrudRepository } from './createCrudRepository.js'

const baseRepository = createCrudRepository(STORE_NAMES.cashflowSnapshots)

export const cashflowSnapshotRepository = {
  ...baseRepository,
  findByCutoff(cutoffId) {
    return db.cashflow_snapshots.where('cutoffId').equals(cutoffId).toArray()
  },
}
