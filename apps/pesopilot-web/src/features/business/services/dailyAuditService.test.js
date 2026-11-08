import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { businessDb } from '../repositories/businessDb.js'
import { businessRepository } from '../repositories/businessRepository.js'
import { businessService } from './businessService.js'
import { buildDailyAudit, dailyAuditService, getManilaDate } from './dailyAuditService.js'

// Client spreadsheet, November 6, 2026. Prices are PHP, sold counts are units.
const novemberSample = [
  ['Shawl', 99, 47, 3, 4], ['Perfume Set', 199, 36, 2, 2],
  ['Room Spray', 75, 30, 8, 6], ['Inhaler', 99, 21, 2, 0],
  ['16"x16"', 250, 50, 6, 4], ['20"x30"', 450, 46, 2, 6],
  ['Roll-On Solo', 199, 96, 1, 1, 'Roll-On'], ['Roll-On Set', 150, 0, 13, 8, 'Roll-On'],
  ['Rub Solo', 199, 79, 1, 0, 'Rub'], ['Rub Set', 150, 0, 10, 0, 'Rub'],
]
const at = (time) => vi.setSystemTime(new Date(time))
const addProduct = (name = 'Product', openingStock = 10, extra = {}) =>
  businessService.addProduct({ name, pricePesos: '99', openingStock, ...extra })
const sell = (product, paymentMethod, quantity, requestKey = `${product.id}-${paymentMethod}`) =>
  businessService.completeSale({ ownerConfirmed: true, requestKey, paymentMethod, items: [{ productId: product.id, quantity }] })
const report = () => dailyAuditService.getReport('2026-11-06')

beforeEach(async () => {
  await businessDb.open()
  await Promise.all(businessDb.tables.map((table) => table.clear()))
  vi.useFakeTimers({ toFake: ['Date'] })
  at('2026-11-05T01:00:00Z')
})
afterEach(async () => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  await Promise.all(businessDb.tables.map((table) => table.clear()))
  businessDb.close()
})

describe('daily audit from real recorded Business transactions', () => {
  it('reconciles every November 6 sample row and counts shared pools exactly once', async () => {
    const products = []
    const sharedPools = new Map()
    for (const [name, price, stock, cash, coop, group] of novemberSample) {
      const product = await addProduct(name, stock, {
        pricePesos: String(price), inventoryPoolId: sharedPools.get(group), inventoryPoolName: group ?? name,
      })
      if (group) sharedPools.set(group, product.inventoryPoolId)
      products.push({ product, cash, coop })
    }
    at('2026-11-06T02:00:00Z')
    for (const { product, cash, coop } of products) {
      if (cash) await sell(product, 'cash', cash)
      if (coop) await sell(product, 'coop', coop)
    }
    const before = await businessRepository.readDailyAuditSource()
    const audit = await report()
    expect(audit.summary).toMatchObject({
      openingQuantity: 405, addedQuantity: 0, availableQuantity: 405,
      totalSold: 79, remainingQuantity: 326, totalCentavos: 1408400,
      payments: { cash: { quantity: 48, centavos: 774100 }, coop: { quantity: 31, centavos: 634300 }, gcash: { quantity: 0, centavos: 0 } },
    })
    expect(audit.groups).toHaveLength(8)
    expect(audit.groups.find((group) => group.name === 'Roll-On')).toMatchObject({ availableQuantity: 96, totalSold: 23, remainingQuantity: 73 })
    expect(audit.groups.find((group) => group.name === 'Rub')).toMatchObject({ availableQuantity: 79, totalSold: 11, remainingQuantity: 68 })
    for (const [name, price, , cash, coop] of novemberSample) {
      const row = audit.groups.flatMap((group) => group.rows).find((item) => item.name === name)
      expect(row).toMatchObject({ priceCentavos: price * 100, totalSold: cash + coop,
        payments: { cash: { quantity: cash, centavos: cash * price * 100 }, coop: { quantity: coop, centavos: coop * price * 100 }, gcash: { quantity: 0, centavos: 0 } } })
    }
    expect(await businessRepository.readDailyAuditSource()).toEqual(before)
  })

  it('keeps Cash, GCash and Coop Pay distinct and retains original prices after changes', async () => {
    const product = await addProduct()
    at('2026-11-06T02:00:00Z')
    await sell(product, 'cash', 1)
    await sell(product, 'gcash', 2)
    await sell(product, 'coop', 3)
    const historical = await report()
    await businessDb.products.update(product.id, { name: 'Changed name', unitPriceCentavos: 12345 })
    expect(await report()).toEqual(historical)
    expect(historical.summary.payments).toEqual({ cash: { quantity: 1, centavos: 9900 }, gcash: { quantity: 2, centavos: 19800 }, coop: { quantity: 3, centavos: 29700 } })
    expect(businessService.summarizeSales(await businessService.listSales())).toEqual({ totalCentavos: 59400, cashCentavos: 9900, gcashCentavos: 19800, coopCentavos: 29700 })
    at('2026-11-06T03:00:00Z')
    await sell(product, 'gcash', 1, 'changed-price')
    expect((await report()).groups[0].rows).toHaveLength(2)
    expect((await report()).summary.payments.gcash.centavos).toBe(32145)
  })

  it('records midnight Manila boundaries, opening stock, same-day restocks and non-sale removals explicitly', async () => {
    const product = await addProduct('Independent', 10)
    at('2026-11-05T15:59:59.999Z')
    await sell(product, 'cash', 1, 'previous-day')
    at('2026-11-05T16:00:00.000Z')
    await sell(product, 'cash', 2, 'start-inclusive')
    await businessService.adjustStock({ productId: product.id, quantity: 5, direction: 'add', reason: 'Delivery' })
    await businessService.adjustStock({ productId: product.id, quantity: 1, direction: 'remove', reason: 'Damaged' })
    at('2026-11-06T15:59:59.999Z')
    await sell(product, 'gcash', 1, 'end-inclusive')
    at('2026-11-06T16:00:00.000Z')
    await sell(product, 'coop', 1, 'next-day')
    expect((await report()).summary).toMatchObject({ openingQuantity: 9, addedQuantity: 5, removedQuantity: 1, availableQuantity: 14, totalSold: 3, remainingQuantity: 10, totalCentavos: 29700 })
    expect(getManilaDate(new Date('2026-11-05T16:00:00Z'))).toBe('2026-11-06')
  })

  it('uses creation snapshots for unsold products and omits future products', async () => {
    const product = await addProduct('Original', 0)
    await businessDb.products.update(product.id, { name: 'Future name', unitPriceCentavos: 54321 })
    expect((await report()).groups[0].rows[0]).toMatchObject({ name: 'Original', priceCentavos: 9900, totalSold: 0 })
    at('2026-11-07T01:00:00Z')
    await addProduct('Future', 5)
    expect((await report()).groups).toHaveLength(1)
    expect((await dailyAuditService.getReport('2026-11-04')).groups).toEqual([])
  })

  it('counts intraday opening stock as an addition and reports empty history', async () => {
    expect((await report()).summary).toMatchObject({ availableQuantity: 0, totalCentavos: 0, totalSold: 0 })
    at('2026-11-06T01:00:00Z')
    await addProduct('New today', 5)
    expect((await report()).summary).toMatchObject({ openingQuantity: 0, addedQuantity: 5, availableQuantity: 5, remainingQuantity: 5 })
  })

  it('rejects invalid dates and inconsistent histories instead of presenting plausible totals', async () => {
    for (const date of ['', '2026-02-30', '2026-13-01', '11/06/2026']) {
      await expect(dailyAuditService.getReport(date)).rejects.toThrow('valid audit date')
    }
    const product = await addProduct()
    at('2026-11-06T01:00:00Z')
    await sell(product, 'cash', 1)
    const source = await businessRepository.readDailyAuditSource()
    expect(() => buildDailyAudit('2026-11-06', { ...source, items: [] })).toThrow('no matching sale item')
    source.items[0].lineTotalCentavos = 1
    expect(() => buildDailyAudit('2026-11-06', source)).toThrow('do not reconcile')
  })

  it('rejects combined variant overselling, rolls back the entire pool and retries idempotently', async () => {
    const solo = await addProduct('Solo', 5)
    const set = await addProduct('Set', 0, { inventoryPoolId: solo.inventoryPoolId, pricePesos: '150' })
    const independent = await addProduct('Independent', 4)
    at('2026-11-06T01:00:00Z')
    const request = { ownerConfirmed: true, requestKey: 'shared', paymentMethod: 'gcash',
      items: [{ productId: solo.id, quantity: 3 }, { productId: set.id, quantity: 3 }] }
    await expect(businessService.completeSale(request)).rejects.toThrow('Insufficient stock')
    expect(await businessDb.sales.count()).toBe(0)
    request.items[1].quantity = 2
    vi.spyOn(businessDb.auditEvents, 'add').mockRejectedValueOnce(new Error('Disk failure'))
    await expect(businessService.completeSale(request)).rejects.toThrow('Disk failure')
    expect(await businessDb.sales.count()).toBe(0)
    expect(await businessDb.saleItems.count()).toBe(0)
    expect(await businessDb.inventoryMovements.count()).toBe(2)
    expect((await businessDb.inventoryPools.get(solo.inventoryPoolId)).stockQuantity).toBe(5)
    await businessService.completeSale(request)
    expect((await businessService.completeSale(request)).duplicate).toBe(true)
    expect((await businessDb.products.get(solo.id)).stockQuantity).toBe(0)
    expect((await businessDb.products.get(set.id)).stockQuantity).toBe(0)
    expect((await businessDb.inventoryPools.get(independent.inventoryPoolId)).stockQuantity).toBe(4)
    expect((await report()).summary).toMatchObject({ availableQuantity: 9, totalSold: 5, remainingQuantity: 4, totalCentavos: 59700 })
  })

  it('serializes competing sales of different variants against their shared pool', async () => {
    const solo = await addProduct('Solo', 3)
    const set = await addProduct('Set', 0, { inventoryPoolId: solo.inventoryPoolId })
    const results = await Promise.allSettled([sell(solo, 'cash', 2), sell(set, 'coop', 2)])
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1)
    expect((await businessService.listProducts()).map((product) => product.stockQuantity)).toEqual([1, 1])
    await businessService.adjustStock({ productId: set.id, quantity: 2, direction: 'add', reason: 'Shared delivery' })
    expect((await businessService.listProducts()).map((product) => product.stockQuantity)).toEqual([3, 3])
  })

  it('refuses invalid or missing pools and opening quantities on shared variants', async () => {
    await expect(addProduct('Variant', 0, { inventoryPoolId: 'missing' })).rejects.toThrow('pool not found')
    const product = await addProduct()
    await expect(addProduct('Variant', 1, { inventoryPoolId: product.inventoryPoolId })).rejects.toThrow('must not add opening stock')
    await expect(addProduct('Variant', 0, { inventoryPoolId: '' })).rejects.toThrow('valid inventory pool')
    expect(await businessDb.products.count()).toBe(1)
  })
})
