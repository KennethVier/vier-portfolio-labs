import { db } from '../dexie.js'
import { STORE_NAMES } from '../schema.js'
import { createCrudRepository } from './createCrudRepository.js'

const baseRepository = createCrudRepository(STORE_NAMES.merchantRules)

export const merchantRuleRepository = {
  ...baseRepository,
  findByKeyword(keyword) {
    return db.merchant_rules.where('keyword').equals(keyword).first()
  },
  findByCategory(categoryId) {
    return db.merchant_rules.where('categoryId').equals(categoryId).toArray()
  },
}
