import { db } from '../dexie.js'
import { DEFAULT_SETTINGS_ID, STORE_NAMES } from '../schema.js'
import { createCrudRepository } from './createCrudRepository.js'

const baseRepository = createCrudRepository(STORE_NAMES.settings)

export const settingsRepository = {
  ...baseRepository,
  getSettings() {
    return db.settings.get(DEFAULT_SETTINGS_ID)
  },
  upsertSettings(settings) {
    return db.settings.put({
      id: DEFAULT_SETTINGS_ID,
      ...settings,
    })
  },
}
