import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import {
  BUSINESS_REALM,
  authorizedBranches,
  createBranchRepository,
  projectBranch,
} from './branchRepository.js'
import { createBusinessService } from '../services/businessService.js'
import {
  buildDailyAudit,
  getManilaDate,
} from '../services/dailyAuditService.js'
import {
  createBranch,
  assignStaff,
  publishCatalog,
} from './branchAdministration.js'
import { branchSchemaPlan } from '../../../../cloud/branch-schema.mjs'

import { fixture, seed } from './branchTestFixture.js'

let db, repo, service, other
beforeEach(async () => {
  vi.stubGlobal('navigator', { onLine: true })
  db = fixture('branch-test-' + crypto.randomUUID())
  await seed(db)
  repo = createBranchRepository(db, { userId: 'employee', branchId: 'A' })
  service = createBusinessService(repo)
})
afterEach(async () => {
  vi.unstubAllGlobals()
  await db.delete()
  if (other) {
    await other.delete()
    other = null
  }
})
const stock = (quantity = 10, key = 'receipt') => ({
  productId: 'lavender',
  quantity,
  direction: 'add',
  reason: 'Supplier delivery verified',
  requestKey: key,
})
const sale = (quantity = 2, key = 'sale') => ({
  requestKey: key,
  ownerConfirmed: true,
  paymentMethod: 'cash',
  items: [
    {
      productId: 'lavender',
      quantity,
      expectedUnitPriceCentavos: 9900,
      saleFormat: 'solo',
    },
  ],
})

it('receives 10, sells 2, projects 8 and reconciles the same sale/audit on a second Admin connection', async () => {
  await service.adjustStock(stock())
  expect((await service.listProducts())[0].stockQuantity).toBe(10)
  const result = await service.completeSale(sale())
  expect(result.sale).toMatchObject({
    branchId: 'A',
    actorId: 'employee',
    totalCentavos: 19800,
  })
  expect((await service.listProducts())[0].stockQuantity).toBe(8)
  const adminConnection = fixture(db.name)
  try {
    const admin = createBranchRepository(adminConnection, {
      userId: 'owner',
      branchId: 'A',
    })
    expect((await admin.listProducts())[0].stockQuantity).toBe(8)
    expect((await admin.listSalesHistory())[0].items[0]).toMatchObject({
      saleFormat: 'solo',
      branchId: 'A',
      quantity: 2,
    })
    const report = buildDailyAudit(
      getManilaDate(),
      await admin.readDailyAuditSource(),
    )
    expect(report.summary).toMatchObject({
      addedQuantity: 10,
      totalSold: 2,
      remainingQuantity: 8,
      totalCentavos: 19800,
    })
    expect(report.transactionCount).toBe(1)
    const branchB = createBranchRepository(adminConnection, {
      userId: 'owner',
      branchId: 'B',
    })
    expect((await branchB.listProducts())[0].stockQuantity).toBe(0)
    expect(await branchB.listSalesHistory()).toEqual([])
  } finally {
    adminConnection.close()
  }
})
it('retries receipts and sales at most once; rejects changed data under a committed key', async () => {
  await service.adjustStock(stock())
  await service.adjustStock(stock())
  const results = await Promise.all([
    service.completeSale(sale()),
    service.completeSale(sale()),
  ])
  expect(results.map((row) => row.duplicate).sort()).toEqual([false, true])
  expect(await db.branchTransactions.count()).toBe(2)
  expect((await repo.listProducts())[0].stockQuantity).toBe(8)
  await expect(service.adjustStock(stock(9))).rejects.toThrow(
    /different operation/,
  )
  await expect(service.completeSale(sale(1))).rejects.toThrow(
    /different operation/,
  )
})
it('rejects branch B, Admin-only writes and ambiguous Staff branches in the repository', async () => {
  await expect(
    createBranchRepository(db, {
      userId: 'employee',
      branchId: 'B',
    }).listProducts(),
  ).rejects.toThrow(/assignment/)
  await expect(repo.addProduct({ stockQuantity: 0 })).rejects.toThrow(/Admin/)
  await expect(repo.setPrice('lavender', 1)).rejects.toThrow(/Admin/)
  await expect(
    createBranchRepository(db, { userId: 'owner', branchId: 'A' }).adjustStock({
      productId: 'lavender',
      delta: 1,
      reason: 'test',
      occurredAt: new Date().toISOString(),
      requestKey: 'admin',
    }),
  ).rejects.toThrow(/assigned Staff/)
  await db.members.add({
    realmId: 'B',
    userId: 'employee',
    accepted: true,
    roles: ['staff'],
  })
  await expect(repo.listProducts()).rejects.toThrow(/Exactly one/)
  expect(await authorizedBranches(db, 'unrelated')).toEqual([])
})
it('requires reasons, validates prices/quantities and rolls back failed appends', async () => {
  expect(() => service.adjustStock({ ...stock(), reason: ' ' })).toThrow(
    /reason/,
  )
  await service.adjustStock(stock())
  await expect(
    service.completeSale({
      ...sale(),
      items: [
        { productId: 'lavender', quantity: 2, expectedUnitPriceCentavos: 1 },
      ],
    }),
  ).rejects.toThrow(/price changed/)
  vi.spyOn(db.branchTransactions, 'add').mockRejectedValueOnce(
    new Error('disk failure'),
  )
  await expect(service.completeSale(sale())).rejects.toMatchObject({
    saleNotRecorded: true,
  })
  expect((await repo.listProducts())[0].stockQuantity).toBe(10)
  expect(await db.branchTransactions.count()).toBe(1)
})
it('keeps shared pool and set-format accounting without duplicating physical stock', async () => {
  const product = await db.branchCatalog.get('lavender')
  await db.branchCatalog.add({
    ...product,
    id: 'set-variant',
    name: 'Set variant',
    unitPriceCentavos: 15000,
    catalog: { ...product.catalog, type: 'Set' },
  })
  await service.adjustStock(stock())
  await service.completeSale({
    ...sale(),
    paymentMethod: 'coop',
    items: [
      {
        productId: 'set-variant',
        quantity: 2,
        expectedUnitPriceCentavos: 15000,
        acceptedUnitPriceCentavos: 15000,
        saleFormat: 'set',
      },
    ],
  })
  expect((await repo.listProducts()).map((p) => p.stockQuantity)).toEqual([
    8, 8,
  ])
  expect((await repo.listSalesHistory())[0]).toMatchObject({
    paymentMethod: 'coop',
    totalCentavos: 30000,
    items: [{ saleFormat: 'set' }],
  })
})
it('preserves disconnected sales, deduplicates transport replay and exposes oversell after merge', async () => {
  await service.adjustStock(stock(3))
  other = fixture('branch-offline-' + crypto.randomUUID())
  await seed(other)
  await other.branchTransactions.bulkAdd(await db.branchTransactions.toArray())
  await other.members.update(2, { userId: 'employee2' })
  await other.members.add({
    realmId: BUSINESS_REALM,
    userId: 'employee2',
    roles: ['staff'],
    accepted: true,
  })
  const remote = createBusinessService(
    createBranchRepository(other, { userId: 'employee2', branchId: 'A' }),
  )
  await service.completeSale(sale(2, 'offline-A'))
  await remote.completeSale(sale(2, 'offline-B'))
  // Fixture-only simulation of provider delivery; production uses Dexie Cloud exclusively.
  const remoteSales = (await other.branchTransactions.toArray()).filter(
    (row) => row.kind === 'sale',
  )
  await db.branchTransactions.bulkPut(remoteSales)
  await db.branchTransactions.bulkPut(remoteSales)
  const state = await repo.source()
  expect(state.sales).toHaveLength(2)
  expect(state.pools[0].stockQuantity).toBe(-1)
  expect(state.conflicts).toHaveLength(1)
  const conflictAudit = buildDailyAudit(getManilaDate(), state, {
    allowNegativeStock: true,
  })
  expect(conflictAudit.summary).toMatchObject({
    remainingQuantity: -1,
    totalSold: 4,
    totalCentavos: 39600,
  })
  await expect(service.completeSale(sale(1, 'blocked'))).rejects.toThrow(
    /conflict/,
  )
  await service.adjustStock(stock(2, 'count-reconciliation'))
  expect((await repo.source()).conflicts).toHaveLength(0)
  db.close()
  await db.open()
  expect((await repo.source()).sales).toHaveLength(2)
  expect((await repo.listProducts())[0].stockQuantity).toBe(1)
})
it('detects tampered branch declarations rather than mixing them into stock', async () => {
  await service.adjustStock(stock())
  const rows = await db.branchTransactions.toArray()
  expect(() => projectBranch([], [{ ...rows[0], branchId: 'B' }], 'A')).toThrow(
    /integrity/,
  )
})
it('creates a branch and retry-safe Staff invitation with branch-only direct permissions', async () => {
  const id = await createBranch(db, 'owner', 'Branch C', 'synthetic-C')
  expect(await createBranch(db, 'owner', 'Branch C', 'synthetic-C')).toBe(id)
  const assigned = await db.members.where('realmId').equals('A').first()
  await db.members.delete(assigned.id)
  await assignStaff(db, 'owner', id, 'staff@example.test')
  await assignStaff(db, 'owner', id, 'staff@example.test')
  const invitations = await db.members.where('realmId').equals(id).toArray()
  expect(invitations).toHaveLength(1)
  expect(invitations[0]).toMatchObject({
    roles: ['staff'],
    permissions: { add: ['branchTransactions'] },
    invite: true,
  })
  await expect(
    assignStaff(db, 'owner', 'B', 'staff@example.test'),
  ).rejects.toThrow(/another branch/)
  await expect(
    createBranch(db, 'employee', 'Forgery', 'forged'),
  ).rejects.toThrow(/Admin/)
})
it('publishes definitions at zero, preserves edited shared prices and refuses Staff publication', async () => {
  const source = {
    ...(await db.branchCatalog.get('lavender')),
    id: 'local-new',
    name: 'Other scent',
    catalog: { category: 'Other Products', family: 'Other scent' },
    inventoryPoolId: 'local-new',
    stockQuantity: 99,
  }
  await publishCatalog(db, 'owner', [source])
  expect((await db.branchCatalog.get(source.id)).stockQuantity).toBe(0)
  await db.branchCatalog.update(source.id, { unitPriceCentavos: 20000 })
  await publishCatalog(db, 'owner', [source])
  expect((await db.branchCatalog.get(source.id)).unitPriceCentavos).toBe(20000)
  await expect(publishCatalog(db, 'employee', [source])).rejects.toThrow(
    /Admin/,
  )
})
it('plans additive sealed hosted schema and preserves every existing table definition', () => {
  const before = {
    sealed: true,
    schema: {
      members: '@id',
      roles: '[realmId+name]',
      realms: '@realmId',
      catalogStock: 'id',
      retained: 'id,value',
    },
  }
  const plan = branchSchemaPlan(before)
  expect(plan.missing).toEqual([
    'branchCatalog',
    'businessBranches',
    'branchTransactions',
  ])
  expect(plan.manifest.schema.retained).toBe('id,value')
  expect(plan.manifest.sealed).toBe(true)
  expect(branchSchemaPlan(plan.manifest).missing).toEqual([])
  expect(() =>
    branchSchemaPlan({
      ...plan.manifest,
      schema: { ...plan.manifest.schema, branchTransactions: '++id' },
    }),
  ).toThrow(/primary key/)
})

it('imports a nonempty legacy shared-pool set fixture once and preserves the original database', async () => {
  const { createBusinessDb } = await import('../repositories/businessDb.js')
  const { createBusinessRepository } =
    await import('../repositories/businessRepository.js')
  const { prepareLegacyImport, importLegacy } =
    await import('./legacyMigration.js')
  const legacy = createBusinessDb('legacy-migration-' + crypto.randomUUID())
  try {
    const legacyService = createBusinessService(
      createBusinessRepository(legacy),
    )
    const solo = await legacyService.addProduct({
      name: 'Original Solo',
      pricePesos: '150',
      openingStock: 10,
    })
    const set = await legacyService.addProduct({
      name: 'Original Set',
      pricePesos: '150',
      inventoryPoolId: solo.inventoryPoolId,
    })
    await legacyService.completeSale({
      ownerConfirmed: true,
      paymentMethod: 'gcash',
      requestKey: 'legacy-sale',
      items: [{ productId: set.id, quantity: 5, saleFormat: 'set' }],
    })
    const stores = Object.fromEntries(
      await Promise.all(
        legacy.tables.map(async (table) => [table.name, await table.toArray()]),
      ),
    )
    const backup = {
      app: 'PesoPilot Business',
      version: 3,
      databaseVersion: 3,
      exportedAt: new Date().toISOString(),
      stores,
    }
    const before = JSON.stringify(stores)
    const branchId = await createBranch(
      db,
      'owner',
      'Legacy default',
      'legacy-default',
    )
    const plan = prepareLegacyImport(backup, branchId)
    expect(plan.counts).toMatchObject({ products: 2, sales: 1 })
    expect(plan.report.summary.remainingQuantity).toBe(5)
    await expect(
      importLegacy(db, 'owner', backup, branchId, false),
    ).rejects.toThrow(/confirm/)
    expect(
      (await importLegacy(db, 'owner', backup, branchId, true)).duplicate,
    ).toBe(false)
    expect(
      (await importLegacy(db, 'owner', backup, branchId, true)).duplicate,
    ).toBe(true)
    const owner = createBranchRepository(db, { userId: 'owner', branchId })
    const state = await owner.source()
    expect(state.sales[0].id).toBe(stores.sales[0].id)
    expect(state.items[0]).toMatchObject({
      saleFormat: 'set',
      actorId: 'legacy:unattributed',
      branchId,
    })
    expect(
      state.products
        .filter((p) => [solo.id, set.id].includes(p.id))
        .map((p) => p.stockQuantity),
    ).toEqual([5, 5])
    expect(
      buildDailyAudit(getManilaDate(), state).summary.remainingQuantity,
    ).toBe(5)
    const after = Object.fromEntries(
      await Promise.all(
        legacy.tables.map(async (table) => [table.name, await table.toArray()]),
      ),
    )
    expect(JSON.stringify(after)).toBe(before)
    const changed = structuredClone(backup)
    changed.stores.products[0].name = 'Changed source'
    // Valid changed-source manifests must not create a second opening/receipt.
    await expect(
      importLegacy(db, 'owner', changed, branchId, true),
    ).rejects.toThrow()
    expect(
      await db.branchTransactions.where('realmId').equals(branchId).count(),
    ).toBe(1)
  } finally {
    await legacy.delete()
  }
})

it('revokes accepted Staff branch visibility after membership removal and cascades business removal', async () => {
  const { changeStaff } = await import('../cloud/client.ts')
  db.cloud.currentUserId = 'owner'
  // Read-back after provider pull is mocked here, not a claim of hosted enforcement.
  await service.adjustStock(stock())
  const businessMember = await db.members
    .where('realmId')
    .equals(BUSINESS_REALM)
    .first()
  await changeStaff(db, { id: businessMember.id })
  expect(await db.members.where('userId').equals('employee').count()).toBe(0)
  await expect(repo.source()).rejects.toThrow(/assignment/)
  expect(await db.branchTransactions.count()).toBe(1)
})

it('exports only authorized operational records in a distinct Admin backup format', async () => {
  const { exportBranchBackup } = await import('./branchBackup.js')
  await service.adjustStock(stock())
  await service.completeSale(sale())
  const backup = JSON.parse(await exportBranchBackup(db, 'owner'))
  expect(backup.app).toBe('PesoPilot Branch Operations')
  expect(backup.transactions).toHaveLength(2)
  expect(backup.transactions[1].actorId).toBe('employee')
  expect(backup.catalog[0].stockQuantity).toBe(0)
  expect(backup).not.toHaveProperty('credentials')
  await expect(exportBranchBackup(db, 'employee')).rejects.toThrow(/Admin/)
})
