import { db } from './dexie.js'
import { APPROVED_STORE_NAMES, pesopilotSchemaV1 } from './schema.js'
import { seedDatabase } from './seed.js'

export async function clearDatabase() {
  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.map((table) => table.clear()))
  })
}

export async function resetDatabase() {
  await clearDatabase()
  await seedDatabase()
}

export async function verifyDatabase() {
  await db.open()

  const existingStoreNames = db.tables.map((table) => table.name).sort()
  const approvedStoreNames = [...APPROVED_STORE_NAMES].sort()
  const missingStores = approvedStoreNames.filter(
    (storeName) => !existingStoreNames.includes(storeName),
  )
  const unexpectedStores = existingStoreNames.filter(
    (storeName) => !approvedStoreNames.includes(storeName),
  )

  return {
    isOpen: db.isOpen(),
    version: db.verno,
    stores: existingStoreNames,
    schema: pesopilotSchemaV1,
    missingStores,
    unexpectedStores,
    isValid:
      db.isOpen() && missingStores.length === 0 && unexpectedStores.length === 0,
  }
}

export { seedDatabase }
