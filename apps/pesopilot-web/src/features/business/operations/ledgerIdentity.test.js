import Dexie from 'dexie'
import dexieCloud from 'dexie-cloud-addon'
import { afterEach, expect, it, vi } from 'vitest'
import {
  branchStores,
  BUSINESS_REALM,
  createBranchRepository,
  projectBranch,
} from './branchRepository.js'
import {
  eventId,
  eventKeys,
  normalizeLedgerEvents,
  previousEvent,
} from './ledgerIdentity.js'
import { deliverAddonRecords } from './addonLedgerHarness.js'
import { readBranchWorkspace } from './workspaceRead.js'
import { inspectBranchLedgerIds } from './ledgerIdDiagnostic.js'
import { createBusinessService } from '../services/businessService.js'
import {
  buildDailyAudit,
  getManilaDate,
} from '../services/dailyAuditService.js'
const A = 'rlm-synthetic-a',
  B = 'rlm-synthetic-b',
  actor = 'synthetic-staff',
  owner = 'synthetic-owner'
const databases = []
afterEach(async () => {
  vi.restoreAllMocks()
  for (const db of databases.splice(0)) await db.delete()
})
async function database() {
  const db = new Dexie('ledger-addon-test-' + crypto.randomUUID(), {
    addons: [dexieCloud],
  })
  databases.push(db)
  db.version(1).stores({ catalogStock: 'id,realmId' })
  db.version(2).stores(branchStores)
  await db.open() // Not configured with a URL: cannot contact a provider.
  await db.realms.bulkAdd(
    [BUSINESS_REALM, A, B].map((realmId) => ({ realmId, owner })),
  )
  await db.businessBranches.bulkAdd(
    [A, B].map((id) => ({
      id,
      branchId: id,
      name: 'Synthetic branch',
      realmId: BUSINESS_REALM,
      owner,
    })),
  )
  await db.members.bulkAdd(
    [BUSINESS_REALM, A].map((realmId) => ({
      realmId,
      userId: actor,
      roles: ['staff'],
      accepted: true,
      owner,
    })),
  )
  await db.branchCatalog.add({
    id: 'lavender',
    name: 'Hallelujah Inhaler Lavender',
    realmId: BUSINESS_REALM,
    owner,
    inventoryPoolId: 'lavender',
    inventoryPoolName: 'Lavender',
    inventoryUnitsPerSale: 1,
    unitPriceCentavos: 9900,
    stockQuantity: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
  })
  return db
}
function receipt() {
  const id = eventKeys(A, actor, 'receipt')[1]
  return {
    id,
    realmId: A,
    branchId: A,
    actorId: actor,
    owner: actor,
    kind: 'stock_adjustment',
    input: { productId: 'lavender', delta: 10, reason: 'Synthetic receipt' },
    occurredAt: new Date().toISOString(),
    movements: [
      {
        id: id + ':movement',
        productId: 'lavender',
        inventoryPoolId: 'lavender',
        delta: 10,
        type: 'stock_adjustment',
        reason: 'Synthetic receipt',
        occurredAt: new Date().toISOString(),
        saleId: null,
      },
    ],
  }
}
it('reproduces JSON-string → array with the actual addon receive path and projects without rewriting storage', async () => {
  vi.spyOn(console, 'debug').mockImplementation(() => {})
  const db = await database(),
    row = receipt()
  await deliverAddonRecords(db, [row])
  const saved = (await db.branchTransactions.toArray())[0]
  expect(saved.id).toEqual(JSON.parse(row.id))
  expect(typeof saved.id).not.toBe('string') // Exact former BRANCH_EVENT_ID predicate.
  expect((await db.branchTransactions.toCollection().primaryKeys())[0]).toEqual(
    saved.id,
  )
  const before = JSON.stringify(await db.branchTransactions.toArray())
  const state = await readBranchWorkspace(db, {
    userId: owner,
    role: 'admin',
    branchId: '',
  })
  expect(state.overviews[0].pools[0].stockQuantity).toBe(10)
  expect(state.readStatus).toBe('ready')
  expect(JSON.stringify(await db.branchTransactions.toArray())).toBe(before)
  const diagnostic = await inspectBranchLedgerIds(db, owner)
  expect(diagnostic.branches[0].groups).toEqual([
    {
      idType: 'array',
      primaryKeyType: 'array',
      hasOwnId: true,
      keyMatchesId: true,
      legacyTuple: true,
      compatibleIdentity: true,
      count: 1,
    },
  ])
  for (const secret of [
    actor,
    owner,
    A,
    row.id,
    row.movements[0].reason,
    'lavender',
  ])
    expect(JSON.stringify(diagnostic)).not.toContain(secret)
})
it('retains idempotency after legacy pull, sells 2 from 10, reopens at 8 and reports the same Admin audit on another addon client', async () => {
  vi.spyOn(console, 'debug').mockImplementation(() => {})
  const db = await database(),
    row = receipt()
  await deliverAddonRecords(db, [row])
  const repo = createBranchRepository(db, { userId: actor, branchId: A })
  expect(
    (
      await repo.adjustStock({
        ...row.input,
        occurredAt: row.occurredAt,
        requestKey: 'receipt',
      })
    ).duplicate,
  ).toBe(true)
  expect(await db.branchTransactions.count()).toBe(1)
  await expect(
    repo.adjustStock({
      ...row.input,
      delta: 11,
      occurredAt: row.occurredAt,
      requestKey: 'receipt',
    }),
  ).rejects.toThrow(/different operation/)
  const service = createBusinessService(repo)
  const input = {
    requestKey: 'sale',
    ownerConfirmed: true,
    paymentMethod: 'cash',
    items: [
      {
        productId: 'lavender',
        quantity: 2,
        expectedUnitPriceCentavos: 9900,
        saleFormat: 'solo',
      },
    ],
  }
  const result = await service.completeSale(input)
  expect(result.sale.id).toBe(eventId(A, actor, 'sale'))
  const second = await database()
  await deliverAddonRecords(second, await db.branchTransactions.toArray())
  const admin = createBranchRepository(second, { userId: owner, branchId: A })
  expect((await admin.listProducts())[0].stockQuantity).toBe(8)
  expect((await admin.listSalesHistory())[0].id).toBe(result.sale.id)
  expect(
    buildDailyAudit(getManilaDate(), await admin.source()).summary,
  ).toMatchObject({
    addedQuantity: 10,
    totalSold: 2,
    remainingQuantity: 8,
    totalCentavos: 19800,
  })
  expect(
    (
      await createBranchRepository(second, {
        userId: owner,
        branchId: B,
      }).listProducts()
    )[0].stockQuantity,
  ).toBe(0)
  await expect(
    createBranchRepository(second, { userId: actor, branchId: B }).adjustStock({
      ...row.input,
      requestKey: 'forbidden',
    }),
  ).rejects.toThrow(/assignment/)
  db.close()
  await db.open()
  await service.completeSale(input)
  expect(await db.branchTransactions.count()).toBe(2)
  expect((await repo.listProducts())[0].stockQuantity).toBe(8)
})
it('coalesces only identical legacy string/array aliases for reads and retries, without deleting either', async () => {
  vi.spyOn(console, 'debug').mockImplementation(() => {})
  const db = await database(),
    row = receipt()
  await db.branchTransactions.add(row)
  await deliverAddonRecords(db, [row])
  expect(await db.branchTransactions.count()).toBe(2)
  expect(
    normalizeLedgerEvents(await db.branchTransactions.toArray()),
  ).toHaveLength(1)
  expect(
    (await previousEvent(db.branchTransactions, A, actor, 'receipt')).id,
  ).toBe(row.id)
  expect(
    (
      await createBranchRepository(db, {
        userId: owner,
        branchId: A,
      }).listProducts()
    )[0].stockQuantity,
  ).toBe(10)
  expect(await db.branchTransactions.count()).toBe(2)
  await db.branchTransactions.update(JSON.parse(row.id), {
    occurredAt: '2026-02-02T00:00:00.000Z',
  })
  await expect(
    previousEvent(db.branchTransactions, A, actor, 'receipt'),
  ).rejects.toMatchObject({ code: 'BRANCH_EVENT_DUPLICATE' })
})
it('rejects malformed/provider-unrelated IDs, mismatched scope, and colliding independent server records', () => {
  const row = receipt()
  for (const id of [
    null,
    17,
    '',
    {},
    [],
    [A, actor],
    [A, actor, 42],
    '[invalid]',
  ]) {
    expect(() => normalizeLedgerEvents([{ ...row, id }])).toThrow(/integrity/)
  }
  expect(() =>
    normalizeLedgerEvents([{ ...row, id: [B, actor, 'receipt'] }]),
  ).toThrow(expect.objectContaining({ code: 'BRANCH_EVENT_ID_SCOPE' }))
  expect(() =>
    normalizeLedgerEvents([row, { ...row, id: eventId(A, actor, 'receipt') }]),
  ).toThrow(expect.objectContaining({ code: 'BRANCH_EVENT_DUPLICATE' }))
  expect(() =>
    projectBranch([], [{ ...row, id: [A, 'someone-else', 'receipt'] }], A),
  ).toThrow(/integrity/)
})
it('reads pulled legacy sales with original nested references and recognizes an existing legacy import', async () => {
  vi.spyOn(console, 'debug').mockImplementation(() => {})
  const db = await database(),
    row = receipt()
  await deliverAddonRecords(db, [row])
  const service = createBusinessService(
    createBranchRepository(db, { userId: actor, branchId: A }),
  )
  const input = {
    requestKey: 'old-sale',
    ownerConfirmed: true,
    paymentMethod: 'gcash',
    items: [
      {
        productId: 'lavender',
        quantity: 2,
        expectedUnitPriceCentavos: 9900,
        saleFormat: 'solo',
      },
    ],
  }
  await service.completeSale(input)
  // Reconstruct the former writer's exact ID format for a synthetic old envelope.
  const current = (await db.branchTransactions.toArray()).find(
    (entry) => entry.kind === 'sale',
  )
  const old = JSON.parse(JSON.stringify(current).replaceAll('evt:', ''))
  const second = await database()
  await deliverAddonRecords(second, [row, old])
  const repo = createBranchRepository(second, { userId: actor, branchId: A })
  const before = JSON.stringify(await second.branchTransactions.toArray())
  const history = await repo.listSalesHistory()
  expect(history[0].id).toBe(old.sale.id)
  expect(history[0].items[0].saleId).toBe(old.sale.id)
  const retried = await createBusinessService(repo).completeSale(input)
  expect(retried.duplicate).toBe(true)
  expect((await repo.listProducts())[0].stockQuantity).toBe(8)
  expect(JSON.stringify(await second.branchTransactions.toArray())).toBe(before)
  const legacy = {
    ...row,
    id: eventKeys(B, 'legacy:pesopilot-business', 'import-v1')[1],
    realmId: B,
    branchId: B,
    actorId: owner,
    kind: 'legacyImport',
    source: { products: [], pools: [], sales: [], items: [], auditEvents: [] },
  }
  await deliverAddonRecords(second, [legacy])
  const priorImport = await previousEvent(
    second.branchTransactions,
    B,
    'legacy:pesopilot-business',
    'import-v1',
  )
  expect(priorImport.source).toEqual(legacy.source)
  expect(
    (
      await createBranchRepository(second, {
        userId: owner,
        branchId: B,
      }).listProducts()
    )[0].stockQuantity,
  ).toBe(10)
})
