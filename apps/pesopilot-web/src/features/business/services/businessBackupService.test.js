import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/lib/db/dexie.js'
import { businessDb } from '../repositories/businessDb.js'
import { businessBackupRepository } from '../repositories/businessBackupRepository.js'
import { businessService } from './businessService.js'
import { dailyAuditService, getManilaDate } from './dailyAuditService.js'
import { businessBackupService } from './businessBackupService.js'
import { BUSINESS_BACKUP_MAX_BYTES } from './businessBackupValidation.js'

const snapshot = () => businessBackupRepository.read()
const readBackup = async () => JSON.parse(await businessBackupService.exportText())
async function fixture() {
  const solo = await businessService.addProduct({ name: '<script>test</script>', pricePesos: '199.99', openingStock: 8 })
  const set = await businessService.addProduct({ name: 'Set', pricePesos: '250', inventoryPoolId: solo.id })
  for (const paymentMethod of ['cash', 'gcash', 'coop']) await businessService.completeSale({
    ownerConfirmed: true, requestKey: paymentMethod, paymentMethod,
    items: [{ productId: solo.id, quantity: 1 }, { productId: set.id, quantity: 1 }],
  })
  await businessService.adjustStock({ productId: set.id, quantity: 2, direction: 'add', reason: 'Delivery' })
  await businessService.adjustStock({ productId: solo.id, quantity: 1, direction: 'remove', reason: 'Damaged' })
  return solo
}

beforeEach(async () => { await Promise.all(businessDb.tables.map((table) => table.clear())) })
afterEach(async () => {
  vi.restoreAllMocks()
  await Promise.all(businessDb.tables.map((table) => table.clear()))
})

describe('Business-only backup integrity and atomic replacement', () => {
  it('round trips all six stores, shared pools, original snapshots and daily audit without touching Personal', async () => {
    const personalBefore = await Promise.all(db.tables.map((table) => table.toArray()))
    await fixture()
    const before = await snapshot()
    const audit = await dailyAuditService.getReport(getManilaDate())
    const text = await businessBackupService.exportText()
    expect(JSON.parse(text)).toMatchObject({ app: 'PesoPilot Business', version: 1, databaseVersion: 2 })
    expect(Object.keys(JSON.parse(text).stores)).toEqual(Object.keys(before))
    await businessService.addProduct({ name: 'Replace me', pricePesos: '1' })
    const plan = await businessBackupService.prepareRestore(text)
    await expect(businessBackupService.restore(plan, false)).rejects.toThrow('Owner confirmation')
    await businessBackupService.restore(plan, true)
    expect(await snapshot()).toEqual(before)
    expect(await dailyAuditService.getReport(getManilaDate())).toEqual(audit)
    expect(await Promise.all(db.tables.map((table) => table.toArray()))).toEqual(personalBefore)
    const product = before.products[0]
    await businessService.adjustStock({ productId: product.id, quantity: 1, direction: 'add', reason: 'After restore' })
    expect((await snapshot()).inventoryMovements.at(-1).id).toBeGreaterThan(before.inventoryMovements.at(-1).id)
  })

  it('supports a new empty database backup', async () => {
    const plan = await businessBackupService.prepareRestore(await businessBackupService.exportText())
    await businessBackupService.restore(plan, true)
    expect(await businessDb.products.count()).toBe(0)
  })

  it('bounds nested and oversized collections before schema parsing', async () => {
    const nested = { value: null }
    let child = nested
    for (let index = 0; index < 20; index += 1) { child.value = {}; child = child.value }
    await expect(businessBackupService.prepareRestore(JSON.stringify(nested))).rejects.toThrow('validation limits')
    const backup = await readBackup()
    backup.stores.products = Array.from({ length: 100001 }, () => ({}))
    await expect(businessBackupService.prepareRestore(JSON.stringify(backup))).rejects.toThrow('validation limits')
    expect(await businessDb.products.count()).toBe(0)
  })

  it.each([
    ['Personal file', (b) => { b.app = 'PesoPilot' }],
    ['future format', (b) => { b.version = 2 }],
    ['future schema', (b) => { b.databaseVersion = 3 }],
    ['extra Personal store', (b) => { b.stores.expenses = [] }],
    ['missing events', (b) => { delete b.stores.auditEvents }],
    ['extra product fields', (b) => { b.stores.products[0].html = '<img onerror=alert(1)>' }],
    ['duplicate product', (b) => { b.stores.products.push(b.stores.products[0]) }],
    ['duplicate request key', (b) => { b.stores.sales[1].requestKey = b.stores.sales[0].requestKey }],
    ['negative pool', (b) => { b.stores.inventoryPools[0].stockQuantity = -1 }],
    ['wrong cached quantity', (b) => { b.stores.products[0].stockQuantity = 4 }],
    ['missing pool', (b) => { b.stores.inventoryPools = [] }],
    ['fractional centavos', (b) => { b.stores.saleItems[0].unitPriceCentavos = 1.5 }],
    ['wrong line total', (b) => { b.stores.saleItems[0].lineTotalCentavos += 1 }],
    ['wrong sale total', (b) => { b.stores.sales[0].totalCentavos += 1 }],
    ['orphan line', (b) => { b.stores.saleItems[0].saleId = 'missing' }],
    ['duplicate line', (b) => { b.stores.saleItems.push({ ...b.stores.saleItems[0], id: 100 }) }],
    ['missing movement', (b) => { b.stores.inventoryMovements.splice(1, 1) }],
    ['broken stock chain', (b) => { b.stores.inventoryMovements[1].beforeQuantity = 100 }],
    ['wrong sale date', (b) => { b.stores.sales[0].confirmedAt = '2020-01-01T00:00:00Z' }],
    ['movement before pool creation', (b) => {
      const date = '2020-01-01T00:00:00Z'
      b.stores.inventoryMovements[0].occurredAt = date
      b.stores.auditEvents[0].occurredAt = date
      b.stores.auditEvents[0].payload.occurredAt = date
    }],
    ['untraceable adjustment', (b) => { delete b.stores.inventoryMovements.at(-1).reason }],
    ['missing sale event', (b) => { b.stores.auditEvents.splice(1, 1) }],
    ['forged event payload', (b) => { b.stores.auditEvents[1].payload.items[0].quantity += 1 }],
    ['duplicate event', (b) => { b.stores.auditEvents.push({ ...b.stores.auditEvents[1], id: 100 }) }],
    ['malformed event payload', (b) => { b.stores.auditEvents[1].payload = { script: 'alert(1)' } }],
  ])('rejects %s before any mutation', async (_, corrupt) => {
    await fixture()
    const before = await snapshot()
    const backup = await readBackup()
    corrupt(backup)
    await expect(businessBackupService.prepareRestore(JSON.stringify(backup))).rejects.toThrow(/backup/i)
    expect(await snapshot()).toEqual(before)
  })

  it('rejects invalid JSON, oversized input and changed plans without mutation', async () => {
    await fixture()
    const before = await snapshot()
    await expect(businessBackupService.prepareRestore('{broken')).rejects.toThrow('JSON')
    await expect(businessBackupService.prepareRestore(' '.repeat(BUSINESS_BACKUP_MAX_BYTES + 1))).rejects.toThrow('10 MiB')
    const plan = await businessBackupService.prepareRestore(await businessBackupService.exportText())
    plan.backup.stores.sales[0].totalCentavos = 0
    await expect(businessBackupService.restore(plan, true)).rejects.toThrow('backup')
    expect(await snapshot()).toEqual(before)
  })

  it('aborts clear-and-replace entirely when a later store write fails', async () => {
    await fixture()
    const text = await businessBackupService.exportText()
    await businessService.addProduct({ name: 'Must survive rollback', pricePesos: '10', openingStock: 4 })
    const before = await snapshot()
    const plan = await businessBackupService.prepareRestore(text)
    const fail = () => { throw new Error('Quota exceeded') }
    businessDb.auditEvents.hook('creating', fail)
    try {
      await expect(businessBackupService.restore(plan, true)).rejects.toThrow('Quota exceeded')
    } finally { businessDb.auditEvents.hook('creating').unsubscribe(fail) }
    expect(await snapshot()).toEqual(before)
  })

  it('refuses stale owner review after a newly committed sale', async () => {
    const product = await fixture()
    const text = await businessBackupService.exportText()
    const plan = await businessBackupService.prepareRestore(text)
    await businessService.completeSale({ ownerConfirmed: true, requestKey: 'new-sale', paymentMethod: 'cash',
      items: [{ productId: product.id, quantity: 1 }] })
    const before = await snapshot()
    await expect(businessBackupService.restore(plan, true)).rejects.toThrow('Business data changed')
    expect(await snapshot()).toEqual(before)
  })
})
