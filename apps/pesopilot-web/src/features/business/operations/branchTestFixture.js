import Dexie from 'dexie'
import { vi } from 'vitest'
import { branchStores, BUSINESS_REALM } from './branchRepository.js'
export function fixture(name) {
  const db = new Dexie(name)
  db.version(1).stores({
    ...branchStores,
    realms: 'realmId',
    members: '++id,realmId,userId',
  })
  db.cloud = { sync: vi.fn().mockResolvedValue(undefined) }
  return db
}
export async function seed(db) {
  await db.realms.bulkAdd([
    { realmId: BUSINESS_REALM, owner: 'owner' },
    { realmId: 'A', owner: 'owner' },
    { realmId: 'B', owner: 'owner' },
  ])
  await db.businessBranches.bulkAdd(
    ['A', 'B'].map((id) => ({
      id,
      branchId: id,
      realmId: BUSINESS_REALM,
      name: 'Branch ' + id,
    })),
  )
  await db.members.bulkAdd([
    {
      realmId: BUSINESS_REALM,
      userId: 'employee',
      email: 'staff@example.test',
      roles: ['staff'],
      accepted: true,
    },
    { realmId: 'A', userId: 'employee', roles: ['staff'], accepted: true },
  ])
  await db.branchCatalog.add({
    id: 'lavender',
    realmId: BUSINESS_REALM,
    owner: null,
    name: 'Hallelujah Inhaler Lavender',
    inventoryPoolId: 'lavender',
    inventoryPoolName: 'Lavender',
    inventoryUnitsPerSale: 1,
    stockQuantity: 0,
    unitPriceCentavos: 9900,
    initialNameSnapshot: 'Hallelujah Inhaler Lavender',
    initialPriceCentavos: 9900,
    createdAt: '2026-01-01T00:00:00.000Z',
    catalog: {
      category: 'Hallelujah Inhaler',
      family: 'Hallelujah Inhaler',
      scent: 'Lavender',
    },
  })
}
