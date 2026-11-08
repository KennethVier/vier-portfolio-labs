import Dexie from 'dexie'
import { expect, it } from 'vitest'
import { createBusinessDb } from './businessDb.js'
import { buildDailyAudit } from '../services/dailyAuditService.js'

it('non-destructively upgrades saved v1 Cash/Coop data, independent quantities and event history', async () => {
  const name = 'business-migration-test'
  await Dexie.delete(name)
  const old = new Dexie(name)
  old.version(1).stores({
    products: 'id, name', sales: 'id, &requestKey, confirmedAt, paymentMethod',
    saleItems: '++id, saleId, productId', inventoryMovements: '++id, productId, saleId, occurredAt',
    auditEvents: '++id, saleId, occurredAt, type',
  })
  await old.open()
  const createdAt = '2026-11-05T01:00:00Z'
  const confirmedAt = '2026-11-06T01:00:00Z'
  const products = [
    { id: 'one', name: 'Original', stockQuantity: 4, unitPriceCentavos: 9900, createdAt },
    { id: 'two', name: 'Separate', stockQuantity: 0, unitPriceCentavos: 10000, createdAt },
  ]
  const sales = ['cash', 'coop'].map((paymentMethod) => ({ id: paymentMethod, requestKey: paymentMethod, paymentMethod, totalCentavos: 9900, confirmedAt }))
  const items = sales.map((sale, index) => ({ id: index + 1, saleId: sale.id, productId: 'one', productNameSnapshot: 'Historical name', quantity: 1, unitPriceCentavos: 9900, lineTotalCentavos: 9900 }))
  const movements = [
    { productId: 'one', type: 'opening_stock', delta: 5, beforeQuantity: 0, afterQuantity: 5, occurredAt: createdAt },
    ...sales.map((sale, index) => ({ productId: 'one', saleId: sale.id, type: 'sale', delta: -1, beforeQuantity: 5 - index, afterQuantity: 4 - index, occurredAt: confirmedAt })),
    { productId: 'one', type: 'stock_received', delta: 1, beforeQuantity: 3, afterQuantity: 4, occurredAt: confirmedAt },
  ]
  const event = { id: 1, type: 'sale_completed', saleId: 'cash', occurredAt: confirmedAt, payload: { original: true } }
  await old.products.bulkAdd(products)
  await old.sales.bulkAdd(sales)
  await old.saleItems.bulkAdd(items)
  await old.inventoryMovements.bulkAdd(movements)
  await old.auditEvents.add(event)
  old.close()
  const upgraded = createBusinessDb(name)
  try {
    await upgraded.open()
    expect(await upgraded.sales.toArray()).toEqual(sales)
    expect(await upgraded.auditEvents.toArray()).toEqual([event])
    expect(await upgraded.inventoryPools.toArray()).toEqual(products.map(({ id, name: poolName, stockQuantity, createdAt: time }) => ({ id, name: poolName, stockQuantity, createdAt: time })))
    for (const original of items) expect(await upgraded.saleItems.get(original.id)).toMatchObject(original)
    for (const original of products) expect(await upgraded.products.get(original.id)).toMatchObject({ ...original, inventoryPoolId: original.id, inventoryUnitsPerSale: 1 })
    const source = { products: await upgraded.products.toArray(), pools: await upgraded.inventoryPools.toArray(), sales: await upgraded.sales.toArray(), items: await upgraded.saleItems.toArray(), movements: await upgraded.inventoryMovements.toArray() }
    expect(buildDailyAudit('2026-11-06', source).summary).toMatchObject({ openingQuantity: 5, addedQuantity: 1, availableQuantity: 6, totalSold: 2, remainingQuantity: 4, totalCentavos: 19800 })
    expect(buildDailyAudit('2026-11-06', source).groups.find((group) => group.id === 'two').rows[0])
      .toMatchObject({ name: 'Separate (name at migration)', priceCentavos: null })
    upgraded.close()
    await upgraded.open()
    expect(await upgraded.inventoryPools.count()).toBe(2)
    expect(await upgraded.inventoryMovements.count()).toBe(4)
    expect(await upgraded.sales.count()).toBe(2)
  } finally {
    upgraded.close()
    await Dexie.delete(name)
  }
})
