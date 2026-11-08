import { db } from '@/lib/db/dexie.js'

export const workspaceRepository = {
  async hasPersonalRecords() {
    // Exclude seeded settings, categories and merchant rules. This is a read-only
    // onboarding check; business workflows never write to the personal database.
    const tables = db.tables.filter((table) => !['settings', 'categories', 'merchant_rules'].includes(table.name))
    const records = await Promise.all(tables.map((table) => table.limit(1).count()))
    return records.some((count) => count > 0)
  },
}
