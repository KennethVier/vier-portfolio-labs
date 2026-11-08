import Dexie from 'dexie'
import { expect, it } from 'vitest'
import { createBusinessDb } from './businessDb.js'
import { createBusinessRepository } from './businessRepository.js'
import { validateBusinessBackup } from '../services/businessBackupValidation.js'

function oldDatabase(name) {
  const database = new Dexie(name)
  database.version(1).stores({
    products: 'id, name', sales: 'id, &requestKey, confirmedAt, paymentMethod',
    saleItems: '++id, saleId, productId', inventoryMovements: '++id, productId, saleId, occurredAt',
    auditEvents: '++id, saleId, occurredAt, type',
  })
  return database
}

it('rolls back an interrupted v1->v2 upgrade and safely retries without duplicating pools', async () => {
  const name = 'business-failed-migration'
  await Dexie.delete(name)
  const old = oldDatabase(name)
  const product = { id: 'old', name: 'Existing', stockQuantity: 5, unitPriceCentavos: 100, createdAt: '2026-11-05T01:00:00Z' }
  await old.products.add(product)
  old.close()
  const upgraded = createBusinessDb(name)
  const abort = () => { throw new Error('Injected migration interruption') }
  upgraded.products.hook('updating', abort)
  try {
    await expect(upgraded.open()).rejects.toThrow('Injected migration interruption')
    upgraded.close()
    const unchanged = oldDatabase(name)
    await unchanged.open()
    expect(unchanged.verno).toBe(1)
    expect(unchanged.tables.map((table) => table.name)).not.toContain('inventoryPools')
    expect(await unchanged.products.toArray()).toEqual([product])
    unchanged.close()
    upgraded.products.hook('updating').unsubscribe(abort)
    await upgraded.open()
    expect(await upgraded.inventoryPools.count()).toBe(1)
    expect((await upgraded.products.get('old')).stockQuantity).toBe(5)
    upgraded.close()
    await upgraded.open()
    expect(await upgraded.inventoryPools.count()).toBe(1)
  } finally { upgraded.close(); await Dexie.delete(name) }
})

it('exports valid migrated Cash/Coop history with untouched legacy payloads and new GCash', async () => {
  const name = 'business-migrated-backup'
  await Dexie.delete(name)
  const old = oldDatabase(name)
  const createdAt = '2026-11-05T01:00:00.000Z'
  await old.products.add({ id: 'one', name: 'Original', stockQuantity: 3, unitPriceCentavos: 100, createdAt })
  const opening = { productId: 'one', saleId: null, type: 'opening_stock', delta: 5,
    beforeQuantity: 0, afterQuantity: 5, occurredAt: createdAt }
  await old.inventoryMovements.add(opening)
  await old.auditEvents.add({ saleId: null, type: 'opening_stock', occurredAt: createdAt, payload: opening })
  for (const [index, paymentMethod] of ['cash', 'coop'].entries()) {
    const confirmedAt = `2026-11-06T0${index + 1}:00:00.000Z`
    const line = { saleId: paymentMethod, productId: 'one', productNameSnapshot: 'Historical', quantity: 1,
      unitPriceCentavos: 100, lineTotalCentavos: 100 }
    const movement = { saleId: paymentMethod, productId: 'one', type: 'sale', delta: -1,
      beforeQuantity: 5 - index, afterQuantity: 4 - index, occurredAt: confirmedAt }
    await old.sales.add({ id: paymentMethod, requestKey: paymentMethod, paymentMethod, totalCentavos: 100, confirmedAt })
    await old.saleItems.add({ ...line })
    await old.inventoryMovements.add({ ...movement })
    await old.auditEvents.add({ saleId: paymentMethod, type: 'sale_completed', occurredAt: confirmedAt,
      payload: { paymentMethod, totalCentavos: 100, items: [line], movements: [movement] } })
  }
  const originalEvents = await old.auditEvents.toArray()
  old.close()
  const upgraded = createBusinessDb(name)
  try {
    await upgraded.open()
    expect(await upgraded.auditEvents.toArray()).toEqual(originalEvents)
    await createBusinessRepository(upgraded).commitConfirmedSale({
      sale: { id: 'gcash', requestKey: 'gcash', paymentMethod: 'gcash', confirmedAt: '2026-11-07T01:00:00.000Z' },
      items: [{ productId: 'one', quantity: 1 }],
    })
    const stores = Object.fromEntries(await Promise.all(upgraded.tables.map(async (table) => [table.name, await table.toArray()])))
    delete stores.productPhotos
    expect(validateBusinessBackup({ app: 'PesoPilot Business', version: 1, databaseVersion: 2,
      exportedAt: '2026-11-08T00:00:00.000Z', stores }).stores.sales).toHaveLength(3)
    expect((await upgraded.inventoryPools.get('one')).stockQuantity).toBe(2)
  } finally { upgraded.close(); await Dexie.delete(name) }
})
