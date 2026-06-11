import { db } from '../dexie.js'
import { STORE_NAMES } from '../schema.js'
import { createCrudRepository } from './createCrudRepository.js'

const baseRepository = createCrudRepository(STORE_NAMES.aiInsights)

export const aiInsightRepository = {
  ...baseRepository,
  findByType(type) {
    return db.ai_insights.where('type').equals(type).toArray()
  },
  findByCutoff(cutoffId) {
    return db.ai_insights.where('cutoffId').equals(cutoffId).toArray()
  },
}
