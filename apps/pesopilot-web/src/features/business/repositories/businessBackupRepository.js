import { businessDb } from './businessDb.js'

export const BUSINESS_BACKUP_STORES = [
  'products', 'inventoryPools', 'sales', 'saleItems', 'inventoryMovements', 'auditEvents', 'productPhotos',
]

async function readStores() {
  return Object.fromEntries(await Promise.all(BUSINESS_BACKUP_STORES.map(async (name) =>
    [name, await businessDb.table(name).toArray()])))
}

export const businessBackupRepository = {
  read() {
    return businessDb.transaction('r', BUSINESS_BACKUP_STORES, readStores)
  },

  replace(stores, expectedSnapshot) {
    return businessDb.transaction('rw', BUSINESS_BACKUP_STORES, async () => {
      // Check under the same write lock: another tab must not lose a sale made
      // after the owner reviewed the replacement. Never merge ledgers.
      if (JSON.stringify(await readStores()) !== expectedSnapshot) {
        throw new Error('Business data changed. Validate the backup again before replacing it.')
      }
      for (const name of BUSINESS_BACKUP_STORES) await businessDb.table(name).clear()
      for (const name of BUSINESS_BACKUP_STORES) await businessDb.table(name).bulkAdd(stores[name] ?? [])
    })
  },
}
