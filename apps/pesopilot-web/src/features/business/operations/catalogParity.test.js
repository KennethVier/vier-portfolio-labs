import Dexie from 'dexie'
import dexieCloud from 'dexie-cloud-addon'
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { fixture, seed } from './branchTestFixture.js'
import {
  branchStores,
  BUSINESS_REALM,
  createBranchRepository,
} from './branchRepository.js'
import { createBusinessService } from '../services/businessService.js'
import { fixturePhoto } from '../services/productPhotoFixture.js'
import { productFamilyId } from '../constants/productPresentation.js'
import { catalogPhotos, saveCatalogPhoto } from './catalogMedia.js'
import { applyServerChanges, encodeIdsForServer } from './addonLedgerHarness.js'
import {
  buildDailyAudit,
  getManilaDate,
} from '../services/dailyAuditService.js'
let db, admin, staff
beforeEach(async () => {
  db = fixture('catalog-parity-' + crypto.randomUUID())
  await seed(db)
  admin = createBranchRepository(db, { userId: 'owner', branchId: 'A' })
  staff = createBusinessService(
    createBranchRepository(db, { userId: 'employee', branchId: 'A' }),
  )
  const lavender = await db.branchCatalog.get('lavender')
  await db.branchCatalog.add({
    ...lavender,
    id: 'turmeric',
    name: 'Hallelujah Inhaler Turmeric',
    inventoryPoolId: 'turmeric',
    catalog: { ...lavender.catalog, scent: 'Turmeric' },
  })
})
afterEach(async () => {
  vi.restoreAllMocks()
  await db.delete()
})
it('commits a multi-scent delivery once, rejects changed input and rolls back invalid rows atomically', async () => {
  const entries = [
    { productId: 'lavender', quantity: 10 },
    { productId: 'turmeric', quantity: 5 },
  ]
  const options = { reason: 'Delivery checked', requestKey: 'delivery' }
  await staff.receiveStock(entries, options)
  await staff.receiveStock(entries, options)
  expect(await db.branchTransactions.count()).toBe(1)
  expect(
    (await admin.listProducts()).map((product) => product.stockQuantity),
  ).toEqual([10, 5])
  const previous = JSON.stringify(await db.branchTransactions.toArray())
  await expect(
    staff.receiveStock([...entries, { productId: 'unknown', quantity: 1 }], {
      ...options,
      requestKey: 'bad',
    }),
  ).rejects.toThrow(/physical/)
  await expect(
    staff.receiveStock(entries, { ...options, reason: 'Different source' }),
  ).rejects.toThrow(/different operation/)
  expect(JSON.stringify(await db.branchTransactions.toArray())).toBe(previous)
  expect(() =>
    staff.receiveStock(entries, { ...options, reason: ' ' }),
  ).toThrow(/reason/)
  expect(
    (
      await createBranchRepository(db, {
        userId: 'owner',
        branchId: 'B',
      }).listProducts()
    ).every((product) => product.stockQuantity === 0),
  ).toBe(true)
  await db.branchCatalog.add({
    ...(await db.branchCatalog.get('lavender')),
    id: 'shared-alias',
    name: 'Shared alias',
  })
  await expect(
    staff.receiveStock(
      [
        { productId: 'lavender', quantity: 2 },
        { productId: 'shared-alias', quantity: 2 },
      ],
      { ...options, requestKey: 'pool-duplicate' },
    ),
  ).rejects.toThrow(/stock group once/)
})
it('records only known future costs; Staff cannot change costs, prices or catalog photos', async () => {
  await staff.receiveStock([{ productId: 'lavender', quantity: 10 }], {
    reason: 'Delivery',
    requestKey: 'receipt',
  })
  const input = {
    ownerConfirmed: true,
    paymentMethod: 'cash',
    requestKey: 'unknown-cost',
    items: [
      { productId: 'lavender', quantity: 1, expectedUnitPriceCentavos: 9900 },
    ],
  }
  await staff.completeSale(input)
  await createBusinessService(admin).setUnitCost('lavender', '70')
  await staff.completeSale({ ...input, requestKey: 'known-cost' })
  const history = await admin.listSalesHistory()
  expect(
    history.find((sale) => sale.requestKey === 'unknown-cost').items[0]
      .unitCostCentavos,
  ).toBeUndefined()
  expect(
    history.find((sale) => sale.requestKey === 'known-cost').items[0]
      .unitCostCentavos,
  ).toBe(7000)
  expect(buildDailyAudit(getManilaDate(), await admin.source()).profit).toEqual(
    { costOfGoods: 7000, grossProfit: 2900, uncostedUnits: 1 },
  )
  await expect(staff.setUnitCost('lavender', '0')).rejects.toThrow(/Admin/)
  const family = productFamilyId(await db.branchCatalog.get('lavender'))
  await expect(
    saveCatalogPhoto(db, 'employee', family, fixturePhoto(family)),
  ).rejects.toThrow(/Admin/)
  await expect(admin.setUnitCost('lavender', -1)).rejects.toThrow(
    /purchase cost/,
  )
  await createBusinessService(admin).setUnitCost('lavender', '')
  expect(
    (await db.branchCatalog.get('lavender')).unitCostCentavos,
  ).toBeUndefined()
  expect(
    (await admin.listSalesHistory()).find(
      (sale) => sale.requestKey === 'known-cost',
    ).items[0].unitCostCentavos,
  ).toBe(7000)
})
it('rejects price overrides without a reason and stores list/accepted prices without modifying the catalog', async () => {
  await staff.receiveStock([{ productId: 'lavender', quantity: 10 }], {
    reason: 'Delivery',
    requestKey: 'receipt',
  })
  const input = {
    ownerConfirmed: true,
    paymentMethod: 'gcash',
    requestKey: 'tawad',
    items: [
      {
        productId: 'lavender',
        quantity: 2,
        expectedUnitPriceCentavos: 9900,
        acceptedUnitPriceCentavos: 9000,
      },
    ],
  }
  await expect(staff.completeSale(input)).rejects.toThrow(/agreed price/)
  expect((await admin.listProducts())[0].stockQuantity).toBe(10)
  const result = await staff.completeSale({
    ...input,
    items: input.items.map((item) => ({
      ...item,
      priceOverrideReason: 'Customer tawad',
    })),
  })
  expect(result.sale.totalCentavos).toBe(18000)
  expect((await admin.listSalesHistory())[0].items[0]).toMatchObject({
    catalogUnitPriceCentavos: 9900,
    priceBasisCentavos: 9900,
    priceOverride: true,
    priceOverrideReason: 'Customer tawad',
    unitPriceCentavos: 9000,
  })
  expect((await db.branchCatalog.get('lavender')).unitPriceCentavos).toBe(9900)
})
it('shares family photos and cost fields through the real pinned addon without a new schema or legacy-photo import', async () => {
  vi.spyOn(console, 'debug').mockImplementation(() => {})
  const cloud = new Dexie('catalog-media-addon-' + crypto.randomUUID(), {
    addons: [dexieCloud],
  })
  cloud.version(1).stores({ catalogStock: 'id,realmId' })
  cloud.version(2).stores(branchStores)
  try {
    await cloud.open()
    await cloud.realms.add({ realmId: BUSINESS_REALM, owner: 'owner' })
    const products = await db.branchCatalog.toArray()
    await cloud.branchCatalog.bulkAdd(products)
    const family = productFamilyId(products[0]),
      photo = fixturePhoto(family)
    await saveCatalogPhoto(cloud, 'owner', family, photo)
    const rows = await cloud.branchCatalog.toArray()
    expect(rows.filter((product) => product.familyPhoto)).toHaveLength(1)
    const transport = encodeIdsForServer(
      cloud.core.schema,
      { isLoggedIn: true, userId: 'owner' },
      [
        {
          table: 'branchCatalog',
          muts: [
            {
              type: 'upsert',
              keys: rows.map((row) => row.id),
              values: structuredClone(rows),
            },
          ],
        },
      ],
    )
    await cloud.transaction('rw', cloud.branchCatalog, () =>
      applyServerChanges(JSON.parse(JSON.stringify(transport)), {
        dx: cloud,
        cloud: cloud.cloud,
        table: (name) => cloud.table(name),
      }),
    )
    expect(catalogPhotos(await cloud.branchCatalog.toArray())).toEqual([photo])
    expect(cloud.verno).toBe(2)
    await saveCatalogPhoto(cloud, 'owner', family, null)
    expect(catalogPhotos(await cloud.branchCatalog.toArray())).toEqual([])
    expect(
      (await cloud.branchCatalog.toArray()).every(
        (row) => row.stockQuantity === 0,
      ),
    ).toBe(true)
  } finally {
    await cloud.delete()
  }
})
it('prepares and explicitly publishes the original standard choices idempotently without receiving stock or overwriting existing prices', async () => {
  const { standardCatalogDefinitions } = await import('./standardCatalog.js')
  const { publishCatalog } = await import('./branchAdministration.js')
  const { previewCatalogImport } = await import('./catalogImport.js')
  const source = standardCatalogDefinitions(await db.branchCatalog.toArray())
  const preview = await previewCatalogImport(db, 'owner', source)
  expect(await db.branchCatalog.count()).toBe(2)
  expect(preview.conflicts).toBe(0)
  await publishCatalog(db, 'owner', source, preview.snapshot)
  const after = await db.branchCatalog.toArray()
  expect(after).toHaveLength(52)
  expect(
    after
      .filter((row) => row.catalog?.type === 'Set')
      .every((row) =>
        after.some(
          (solo) =>
            solo.catalog?.type === 'Solo' &&
            solo.inventoryPoolId === row.inventoryPoolId,
        ),
      ),
  ).toBe(true)
  await admin.setPrice('lavender', 12000)
  await publishCatalog(
    db,
    'owner',
    standardCatalogDefinitions(await db.branchCatalog.toArray()),
  )
  expect(await db.branchCatalog.count()).toBe(52)
  expect((await db.branchCatalog.get('lavender')).unitPriceCentavos).toBe(12000)
  expect(await db.branchTransactions.count()).toBe(0)
})
