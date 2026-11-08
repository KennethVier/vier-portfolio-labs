import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { businessDb } from '../repositories/businessDb.js'
import { businessService } from './businessService.js'

const completeSale = (request) => businessService.completeSale({ ownerConfirmed: true, ...request })

async function clearBusiness() {
  for (const table of businessDb.tables) {
    await table.clear()
  }
}

beforeEach(async () => {
  await businessDb.open()
  await clearBusiness()
})

afterEach(async () => {
  vi.restoreAllMocks()
  await clearBusiness()
  businessDb.close()
})

describe('Business Mode: independent inventory and sale safety', () => {
  const productInput = { name: 'Pillow', pricePesos: '350.25', openingStock: 5 }
  const requestFor = (product, extra = {}) => ({
    requestKey: 'sale-1', paymentMethod: 'cash',
    items: [{ productId: product.id, quantity: 2 }], ...extra,
  })

  it.each([
    [{ name: '' }, 'name'], [{ name: ' '.repeat(4) }, 'name'],
    [{ name: null }, 'name'], [{ name: 123 }, 'name'],
    [{ name: 'x'.repeat(121) }, 'name'], [{ pricePesos: '0' }, 'Price'],
    [{ pricePesos: '-1' }, 'Price'], [{ pricePesos: '1e3' }, 'Price'],
    [{ pricePesos: '9007199254740991' }, 'Price'], [{ pricePesos: 'abc' }, 'Price'],
    [{ openingStock: 0.5 }, 'Quantity'], [{ openingStock: NaN }, 'Quantity'],
    [{ openingStock: Number.MAX_SAFE_INTEGER + 1 }, 'Quantity'],
  ])('rejects invalid product input %j without writing', async (changes, message) => {
    await expect(businessService.addProduct({ ...productInput, ...changes })).rejects.toThrow(message)
    expect(await businessDb.products.count()).toBe(0)
    expect(await businessDb.inventoryMovements.count()).toBe(0)
  })

  it('trims product names, preserves centavos and accepts zero opening stock', async () => {
    const product = await businessService.addProduct({ ...productInput, name: ' Pillow ', openingStock: 0 })
    expect(product).toMatchObject({ name: 'Pillow', unitPriceCentavos: 35025, stockQuantity: 0 })
    expect(await businessDb.inventoryMovements.count()).toBe(0)
  })

  it.each(['', '  ', null, 123, 'x'.repeat(241)])('requires a valid manual adjustment reason %j', async (reason) => {
    const product = await businessService.addProduct(productInput)
    expect(() => businessService.adjustStock({ productId: product.id, quantity: 1, direction: 'add', reason }))
      .toThrow('reason')
    expect((await businessDb.products.get(product.id)).stockQuantity).toBe(5)
    expect(await businessDb.inventoryMovements.count()).toBe(1)
  })

  it.each([0, -1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])('rejects invalid adjustment quantity %s', async (quantity) => {
    expect(() => businessService.adjustStock({ productId: 'id', quantity, direction: 'add', reason: 'Delivery' })).toThrow('Quantity')
  })

  it('records signed adjustments with reasons and rejects stock underflow and overflow', async () => {
    const product = await businessService.addProduct(productInput)
    await businessService.adjustStock({ productId: product.id, quantity: 2, direction: 'remove', reason: ' Damaged units ' })
    expect((await businessDb.products.get(product.id)).stockQuantity).toBe(3)
    expect((await businessDb.inventoryMovements.toArray())[1]).toMatchObject({
      delta: -2, reason: 'Damaged units', beforeQuantity: 5, afterQuantity: 3,
    })
    await expect(businessService.adjustStock({ productId: product.id, quantity: 4, direction: 'remove', reason: 'Miscount' })).rejects.toThrow('Insufficient stock')
    await expect(businessService.adjustStock({ productId: product.id, quantity: Number.MAX_SAFE_INTEGER, direction: 'add', reason: 'Delivery' })).rejects.toThrow('Stock limit')
    expect(await businessDb.inventoryMovements.count()).toBe(2)
  })

  it('rolls back stock adjustment when its event cannot be written', async () => {
    const product = await businessService.addProduct(productInput)
    vi.spyOn(businessDb.auditEvents, 'add').mockRejectedValueOnce(new Error('Write failed'))
    await expect(businessService.adjustStock({ productId: product.id, quantity: 1, direction: 'remove', reason: 'Damaged' })).rejects.toThrow('Write failed')
    expect((await businessDb.products.get(product.id)).stockQuantity).toBe(5)
    expect(await businessDb.inventoryMovements.count()).toBe(1)
    expect(await businessDb.auditEvents.count()).toBe(1)
  })

  it.each(['card', '', 'Cash', null])('rejects unsupported payment method %s', async (paymentMethod) => {
    const product = await businessService.addProduct(productInput)
    await expect(completeSale(requestFor(product, { paymentMethod }))).rejects.toThrow('Cash, GCash or Coop Pay')
    expect(await businessDb.sales.count()).toBe(0)
  })

  it('requires explicit owner confirmation', async () => {
    const product = await businessService.addProduct(productInput)
    await expect(businessService.completeSale(requestFor(product))).rejects.toThrow('Owner confirmation')
    expect((await businessDb.products.get(product.id)).stockQuantity).toBe(5)
  })

  it('previews the exact integer-centavo total and rejects unavailable quantities', () => {
    const product = { stockQuantity: 5, unitPriceCentavos: 35025 }
    expect(businessService.previewSale(product, 2)).toEqual({ quantity: 2, unitPriceCentavos: 35025, totalCentavos: 70050 })
    expect(() => businessService.previewSale(product, 6)).toThrow('Insufficient stock')
    expect(() => businessService.previewSale(product, 0.5)).toThrow('Quantity')
  })

  it('deduplicates simultaneous submissions', async () => {
    const product = await businessService.addProduct(productInput)
    const results = await Promise.all([completeSale(requestFor(product)), completeSale(requestFor(product))])
    expect(results.map((result) => result.duplicate).sort()).toEqual([false, true])
    expect(await businessDb.sales.count()).toBe(1)
    expect(await businessDb.saleItems.count()).toBe(1)
    expect((await businessDb.products.get(product.id)).stockQuantity).toBe(3)
  })

  it('serializes different sales competing for the last stock', async () => {
    const product = await businessService.addProduct({ ...productInput, openingStock: 2 })
    const results = await Promise.allSettled([
      completeSale(requestFor(product)), completeSale(requestFor(product, { requestKey: 'sale-2' })),
    ])
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1)
    expect((await businessDb.products.get(product.id)).stockQuantity).toBe(0)
    expect(await businessDb.sales.count()).toBe(1)
  })

  it('rejects reusing a committed key for a changed sale', async () => {
    const product = await businessService.addProduct(productInput)
    await completeSale(requestFor(product))
    await expect(completeSale(requestFor(product, { paymentMethod: 'coop' }))).rejects.toThrow('different sale')
    await expect(completeSale(requestFor(product, { items: [{ productId: product.id, quantity: 1 }] }))).rejects.toThrow('different sale')
    expect((await businessDb.products.get(product.id)).stockQuantity).toBe(3)
  })

  it('rolls back every sale write when the final event fails, then safely retries', async () => {
    const product = await businessService.addProduct(productInput)
    vi.spyOn(businessDb.auditEvents, 'add').mockRejectedValueOnce(new Error('Disk failure'))
    await expect(completeSale(requestFor(product))).rejects.toMatchObject({ message: 'Disk failure', saleNotRecorded: true })
    expect(await businessDb.sales.count()).toBe(0)
    expect(await businessDb.saleItems.count()).toBe(0)
    expect(await businessDb.inventoryMovements.count()).toBe(1)
    expect(await businessDb.auditEvents.count()).toBe(1)
    expect((await businessDb.products.get(product.id)).stockQuantity).toBe(5)
    expect((await completeSale(requestFor(product))).duplicate).toBe(false)
    expect((await businessDb.products.get(product.id)).stockQuantity).toBe(3)
  })

  it('preserves history snapshots after product metadata changes and orders newest first', async () => {
    const product = await businessService.addProduct(productInput)
    const first = await completeSale(requestFor(product))
    await businessDb.products.update(product.id, { name: 'Changed pillow', unitPriceCentavos: 90000 })
    await businessDb.sales.update(first.sale.id, { confirmedAt: '2020-01-01T00:00:00.000Z' })
    const second = await completeSale(requestFor(product, { requestKey: 'sale-2', paymentMethod: 'coop' }))
    const history = await businessService.listSalesHistory()
    expect(history.map((sale) => sale.id)).toEqual([second.sale.id, first.sale.id])
    expect(history[1].items[0]).toMatchObject({ productNameSnapshot: 'Pillow', unitPriceCentavos: 35025, quantity: 2, lineTotalCentavos: 70050 })
    expect(history[1].totalCentavos).toBe(70050)
    expect(history[0].items[0].productNameSnapshot).toBe('Changed pillow')
  })

  it('rejects a stale reviewed price before any sale writes', async () => {
    const product = await businessService.addProduct(productInput)
    await expect(completeSale(requestFor(product, { items: [{ productId: product.id, quantity: 1, expectedUnitPriceCentavos: 1 }] }))).rejects.toThrow('price changed')
    expect(await businessDb.sales.count()).toBe(0)
  })

  it('rejects a multi-item sale with one missing product without partial writes', async () => {
    const product = await businessService.addProduct(productInput)
    await expect(completeSale(requestFor(product, { items: [{ productId: product.id, quantity: 1 }, { productId: 'missing', quantity: 1 }] }))).rejects.toThrow('Product not found')
    expect(await businessDb.sales.count()).toBe(0)
    expect((await businessDb.products.get(product.id)).stockQuantity).toBe(5)
  })

  it('rejects duplicate line items and invalid quantities', async () => {
    const product = await businessService.addProduct(productInput)
    await expect(completeSale(requestFor(product, { items: [{ productId: product.id, quantity: 1 }, { productId: product.id, quantity: 1 }] }))).rejects.toThrow('different product')
    await expect(completeSale(requestFor(product, { items: [{ productId: product.id, quantity: -1 }] }))).rejects.toThrow('Quantity')
  })

  it('records opening stock and receiving stock', async () => {
    const product = await businessService.addProduct({
      name: 'Pillow',
      pricePesos: '350.00',
      openingStock: 20,
    })
    await businessService.adjustStock({ productId: product.id, quantity: 3, direction: 'add', reason: 'Delivery' })

    expect((await businessService.listProducts())[0]).toMatchObject({
      name: 'Pillow',
      unitPriceCentavos: 35000,
      stockQuantity: 23,
    })
    expect((await businessService.listAuditEvents()).map((item) => item.type)).toContain(
      'stock_adjustment',
    )
  })

  it('atomically sells products for Cash and stores price and stock snapshots', async () => {
    const pillow = await businessService.addProduct({
      name: 'Pillow',
      pricePesos: '350',
      openingStock: 20,
    })
    const result = await completeSale({
      requestKey: 'sell-pillow-1',
      items: [{ productId: pillow.id, quantity: 2 }],
      paymentMethod: 'cash',
    })

    expect(result.sale).toMatchObject({ paymentMethod: 'cash', totalCentavos: 70000 })
    expect((await businessService.listProducts())[0].stockQuantity).toBe(18)
    expect((await businessDb.saleItems.toArray())[0]).toMatchObject({
      productNameSnapshot: 'Pillow',
      quantity: 2,
      unitPriceCentavos: 35000,
    })
    const saleEvent = (await businessService.listAuditEvents()).find(
      (event) => event.type === 'sale_completed',
    )
    expect(saleEvent.payload.movements[0]).toMatchObject({
      beforeQuantity: 20,
      afterQuantity: 18,
    })
  })

  it('accepts Coop as a manual method without claiming settlement', async () => {
    const product = await businessService.addProduct({
      name: 'Blanket',
      pricePesos: '800',
      openingStock: 1,
    })
    const result = await completeSale({
      requestKey: 'coop-1',
      paymentMethod: 'coop',
      items: [{ productId: product.id, quantity: 1 }],
    })
    expect(result.sale.paymentMethod).toBe('coop')
  })

  it('rejects insufficient stock and writes neither a sale nor an audit', async () => {
    const product = await businessService.addProduct({
      name: 'Pillow',
      pricePesos: '350',
      openingStock: 1,
    })
    const beforeEvents = await businessDb.auditEvents.count()
    await expect(
      completeSale({
        requestKey: 'failure-1',
        paymentMethod: 'cash',
        items: [{ productId: product.id, quantity: 2 }],
      }),
    ).rejects.toThrow('Insufficient stock')

    expect(await businessDb.sales.count()).toBe(0)
    expect(await businessDb.auditEvents.count()).toBe(beforeEvents)
    expect((await businessService.listProducts())[0].stockQuantity).toBe(1)
  })

  it('deduplicates a retry using the same request key', async () => {
    const product = await businessService.addProduct({
      name: 'Pillow',
      pricePesos: '350',
      openingStock: 5,
    })
    const request = {
      requestKey: 'same-sale-retry',
      paymentMethod: 'cash',
      items: [{ productId: product.id, quantity: 2 }],
    }
    const first = await completeSale(request)
    const retry = await completeSale(request)
    expect(first.duplicate).toBe(false)
    expect(retry.duplicate).toBe(true)
    expect(await businessDb.sales.count()).toBe(1)
    expect((await businessService.listProducts())[0].stockQuantity).toBe(3)
  })

  it('validates values before writing records', async () => {
    await expect(
      businessService.addProduct({ name: 'Pillow', pricePesos: '350.999', openingStock: 1 }),
    ).rejects.toThrow('Price')
    await expect(
      businessService.addProduct({ name: 'Pillow', pricePesos: '350', openingStock: -1 }),
    ).rejects.toThrow('Quantity')
    expect(await businessDb.products.count()).toBe(0)
  })
})
