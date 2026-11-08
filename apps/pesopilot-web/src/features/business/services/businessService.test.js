import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { businessDb } from '../repositories/businessDb.js'
import { businessService } from './businessService.js'

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
  await clearBusiness()
  businessDb.close()
})

describe('Business Mode: independent inventory and sale safety', () => {
  it('records opening stock and receiving stock', async () => {
    const product = await businessService.addProduct({
      name: 'Pillow',
      pricePesos: '350.00',
      openingStock: 20,
    })
    await businessService.receiveStock({ productId: product.id, quantity: 3 })

    expect((await businessService.listProducts())[0]).toMatchObject({
      name: 'Pillow',
      unitPriceCentavos: 35000,
      stockQuantity: 23,
    })
    expect((await businessService.listAuditEvents()).map((item) => item.type)).toContain(
      'stock_received',
    )
  })

  it('atomically sells products for Cash and stores price and stock snapshots', async () => {
    const pillow = await businessService.addProduct({
      name: 'Pillow',
      pricePesos: '350',
      openingStock: 20,
    })
    const result = await businessService.completeSale({
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
    const result = await businessService.completeSale({
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
      businessService.completeSale({
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
    const first = await businessService.completeSale(request)
    const retry = await businessService.completeSale(request)
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
