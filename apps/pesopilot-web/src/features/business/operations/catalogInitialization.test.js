import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { fixture, seed } from './branchTestFixture.js'
import {
  initializeStandardCatalog,
  catalogInitializationState,
} from './catalogInitialization.js'
import { BUSINESS_REALM } from './branchRepository.js'
import { fixturePhoto } from '../services/productPhotoFixture.js'
import { productFamilyId } from '../constants/productPresentation.js'
let db
beforeEach(async () => {
  db = fixture('catalog-init-' + crypto.randomUUID())
  await seed(db)
  db.cloud.options = { databaseUrl: 'https://z5jxogiwe.dexie.cloud' }
})
afterEach(async () => {
  vi.restoreAllMocks()
  await db.delete()
})
it('initializes only missing approved definitions once and preserves names, IDs, prices, costs, photos and stock history', async () => {
  const p = await db.branchCatalog.get('lavender')
  await db.branchCatalog.update(p.id, {
    name: 'My customized Lavender',
    unitPriceCentavos: 12345,
    unitCostCentavos: 7654,
    familyPhoto: fixturePhoto(productFamilyId(p)),
  })
  const before = await db.branchCatalog.get(p.id)
  const result = await initializeStandardCatalog(db, 'owner')
  expect(result.added).toBe(51)
  expect(await db.branchCatalog.count()).toBe(52)
  expect(await db.branchCatalog.get(p.id)).toEqual(before)
  expect(
    (await db.branchCatalog.toArray()).every((row) => row.stockQuantity === 0),
  ).toBe(true)
  expect(await db.branchTransactions.count()).toBe(0)
  const update = vi.spyOn(db.branchCatalog, 'update'),
    add = vi.spyOn(db.branchCatalog, 'add')
  expect((await initializeStandardCatalog(db, 'owner')).added).toBe(0)
  expect(update).not.toHaveBeenCalled()
  expect(add).not.toHaveBeenCalled()
})
it('blocks Staff, non-owner Admin and another configured database without writing', async () => {
  await expect(initializeStandardCatalog(db, 'employee')).rejects.toThrow(
    /owner/,
  )
  await db.members.add({
    realmId: BUSINESS_REALM,
    userId: 'secondary',
    roles: ['admin'],
    accepted: true,
  })
  await expect(initializeStandardCatalog(db, 'secondary')).rejects.toThrow(
    /owner/,
  )
  db.cloud.options.databaseUrl = 'https://production.invalid'
  await expect(initializeStandardCatalog(db, 'owner')).rejects.toThrow(
    /development/,
  )
  expect(await db.branchCatalog.count()).toBe(1)
})
it('leaves duplicate definitions and ID conflicts untouched for owner review', async () => {
  const p = await db.branchCatalog.get('lavender')
  await db.branchCatalog.add({ ...p, id: 'duplicate' })
  const before = JSON.stringify(await db.branchCatalog.toArray())
  await expect(initializeStandardCatalog(db, 'owner')).rejects.toThrow(
    /duplicate/,
  )
  expect(JSON.stringify(await db.branchCatalog.toArray())).toBe(before)
})
it('rolls back a partial local failure, safely retries, and does not reinitialize an incomplete marked pull', async () => {
  const add = db.branchCatalog.add.bind(db.branchCatalog)
  vi.spyOn(db.branchCatalog, 'add')
    .mockImplementationOnce(add)
    .mockRejectedValueOnce(new Error('disk unavailable'))
  await expect(initializeStandardCatalog(db, 'owner')).rejects.toThrow(/disk/)
  expect(await db.branchCatalog.count()).toBe(1)
  vi.restoreAllMocks()
  await initializeStandardCatalog(db, 'owner')
  const rows = await db.branchCatalog.toArray(),
    marker = rows.find((row) => row.standardCatalogSetup)
  const partial = fixture('partial-client-' + crypto.randomUUID())
  partial.cloud.options = db.cloud.options
  try {
    await seed(partial)
    await partial.branchCatalog.put(marker)
    expect(
      catalogInitializationState(await partial.branchCatalog.toArray()),
    ).toMatchObject({ initialized: true })
    expect((await initializeStandardCatalog(partial, 'owner')).added).toBe(0)
    // Finish the representative authenticated pull, without seeding another business catalog.
    await partial.branchCatalog.bulkPut(rows)
    const { createBranchRepository } = await import('./branchRepository.js')
    const staff = createBranchRepository(partial, {
      userId: 'employee',
      branchId: 'A',
    })
    expect((await staff.listProducts()).length).toBe(52)
    await expect(staff.setPrice('lavender', 1)).rejects.toThrow(/Admin/)
    expect(
      catalogInitializationState(await partial.branchCatalog.toArray()),
    ).toEqual({ initialized: true, missing: 0, conflicts: 0 })
    expect(await partial.branchTransactions.count()).toBe(0)
  } finally {
    await partial.delete()
  }
})
it('preserves customized marker-anchor and custom products while concurrent Admin connections initialize only once', async () => {
  const shawl = {
    id: 'my-shawl',
    name: 'Owner shawl display name',
    realmId: BUSINESS_REALM,
    unitPriceCentavos: 55500,
    unitCostCentavos: 32100,
    inventoryPoolId: 'my-pool',
    inventoryPoolName: 'My shawl stock',
    inventoryUnitsPerSale: 1,
    stockQuantity: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    initialNameSnapshot: 'Shawl A',
    initialPriceCentavos: 9900,
    catalog: { category: 'Shawls', family: 'Shawl A' },
  }
  shawl.familyPhoto = fixturePhoto(productFamilyId(shawl))
  const custom = {
    ...shawl,
    id: 'custom',
    name: 'Custom product',
    inventoryPoolId: 'custom-pool',
    catalog: { category: 'Other products', family: 'Custom product' },
  }
  await db.branchCatalog.bulkAdd([shawl, custom])
  const other = fixture(db.name)
  other.cloud.options = db.cloud.options
  try {
    const result = await Promise.all([
      initializeStandardCatalog(db, 'owner'),
      initializeStandardCatalog(other, 'owner'),
    ])
    expect(result.map((row) => row.added).sort((a, b) => a - b)).toEqual([
      0, 50,
    ])
    expect(await db.branchCatalog.count()).toBe(53)
    expect(await db.branchCatalog.get('my-shawl')).toEqual({
      ...shawl,
      standardCatalogSetup: { version: 1 },
    })
    expect(await db.branchCatalog.get('custom')).toEqual(custom)
    expect(await db.branchTransactions.count()).toBe(0)
  } finally {
    other.close()
  }
})
