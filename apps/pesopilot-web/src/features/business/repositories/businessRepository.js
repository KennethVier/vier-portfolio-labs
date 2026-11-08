import { businessDb } from './businessDb.js'

export function createBusinessRepository(businessDb) {
  return {
  listProducts() {
    return businessDb.transaction('r', businessDb.products, businessDb.inventoryPools, async () => {
      const pools = new Map((await businessDb.inventoryPools.toArray()).map((pool) => [pool.id, pool]))
      return (await businessDb.products.orderBy('name').toArray()).map((product) => {
        const pool = pools.get(product.inventoryPoolId)
        if (!pool) throw new Error('Inventory pool not found')
        return { ...product, stockQuantity: pool.stockQuantity, inventoryPoolName: pool.name }
      })
    })
  },

  readDailyAuditSource() {
    return businessDb.transaction('r', [businessDb.products, businessDb.inventoryPools,
      businessDb.sales, businessDb.saleItems, businessDb.inventoryMovements], async () => ({
      products: await businessDb.products.toArray(),
      pools: await businessDb.inventoryPools.toArray(),
      sales: await businessDb.sales.toArray(),
      items: await businessDb.saleItems.toArray(),
      movements: await businessDb.inventoryMovements.toArray(),
    }))
  },

  listSales() {
    return businessDb.sales.orderBy('confirmedAt').reverse().toArray()
  },

  listSalesHistory() {
    return businessDb.transaction('r', businessDb.sales, businessDb.saleItems, async () => {
      const sales = await this.listSales()
      const items = await businessDb.saleItems.toArray()
      const bySale = new Map()
      for (const item of items) {
        if (!bySale.has(item.saleId)) bySale.set(item.saleId, [])
        bySale.get(item.saleId).push(item)
      }
      return sales.map((sale) => ({ ...sale, items: bySale.get(sale.id) ?? [] }))
    })
  },

  listAuditEvents() {
    return businessDb.auditEvents.orderBy('occurredAt').reverse().toArray()
  },

  async addProduct(product) {
    await businessDb.transaction(
      'rw',
      businessDb.products,
      businessDb.inventoryPools,
      businessDb.inventoryMovements,
      businessDb.auditEvents,
      async () => {
        let pool
        if (product.inventoryPoolId !== product.id) {
          pool = await businessDb.inventoryPools.get(product.inventoryPoolId)
          if (!pool) throw new Error('Inventory pool not found')
          if (product.stockQuantity !== 0) throw new Error('Shared variants must not add opening stock')
        } else {
          pool = { id: product.id, name: product.inventoryPoolName, stockQuantity: product.stockQuantity, createdAt: product.createdAt }
          await businessDb.inventoryPools.add(pool)
        }
        const openingQuantity = product.stockQuantity
        product = { ...product, stockQuantity: pool.stockQuantity }
        await businessDb.products.add(product)
        if (product.inventoryPoolId === product.id && openingQuantity > 0) {
          const movement = {
            productId: product.id,
            inventoryPoolId: pool.id,
            poolNameSnapshot: pool.name,
            saleId: null,
            type: 'opening_stock',
            delta: product.stockQuantity,
            beforeQuantity: 0,
            afterQuantity: product.stockQuantity,
            occurredAt: product.createdAt,
          }
          await businessDb.inventoryMovements.add(movement)
          await businessDb.auditEvents.add({
            saleId: null,
            type: 'opening_stock',
            occurredAt: product.createdAt,
            payload: movement,
          })
        }
      },
    )
    return product
  },

  async adjustStock({ productId, delta, reason, occurredAt }) {
    return businessDb.transaction(
      'rw',
      businessDb.products,
      businessDb.inventoryPools,
      businessDb.inventoryMovements,
      businessDb.auditEvents,
      async () => {
        const product = await businessDb.products.get(productId)
        if (!product) throw new Error('Product not found')
        const pool = await businessDb.inventoryPools.get(product.inventoryPoolId)
        if (!pool) throw new Error('Inventory pool not found')
        if (!Number.isSafeInteger(pool.stockQuantity) || pool.stockQuantity < 0) throw new Error('Invalid stored stock')
        const afterQuantity = pool.stockQuantity + delta
        if (!Number.isSafeInteger(afterQuantity)) throw new Error('Stock limit exceeded')
        if (afterQuantity < 0) throw new Error('Insufficient stock')
        const movement = {
          productId,
          inventoryPoolId: pool.id,
          poolNameSnapshot: pool.name,
          saleId: null,
          type: 'stock_adjustment',
          delta,
          reason,
          beforeQuantity: pool.stockQuantity,
          afterQuantity,
          occurredAt,
        }
        await businessDb.inventoryPools.update(pool.id, { stockQuantity: afterQuantity })
        await businessDb.products.where('inventoryPoolId').equals(pool.id).modify({ stockQuantity: afterQuantity })
        await businessDb.inventoryMovements.add(movement)
        await businessDb.auditEvents.add({
          saleId: null,
          type: 'stock_adjustment',
          occurredAt,
          payload: movement,
        })
        return afterQuantity
      },
    )
  },

  async commitConfirmedSale({ sale, items }) {
    return businessDb.transaction(
      'rw',
      businessDb.products,
      businessDb.inventoryPools,
      businessDb.sales,
      businessDb.saleItems,
      businessDb.inventoryMovements,
      businessDb.auditEvents,
      async () => {
        const previous = await businessDb.sales
          .where('requestKey')
          .equals(sale.requestKey)
          .first()
        if (previous) {
          const previousItems = await businessDb.saleItems.where('saleId').equals(previous.id).toArray()
          const matches = previous.paymentMethod === sale.paymentMethod &&
            previousItems.length === items.length && items.every((item) =>
              previousItems.some((saved) => saved.productId === item.productId &&
                saved.quantity === item.quantity && (item.expectedUnitPriceCentavos === undefined ||
                  saved.unitPriceCentavos === item.expectedUnitPriceCentavos)))
          if (!matches) throw new Error('This request key already belongs to a different sale')
          return { sale: previous, duplicate: true }
        }

        let totalCentavos = 0
        const lineItems = []
        const movements = []
        const remainingByPool = new Map()

        for (const item of items) {
          const product = await businessDb.products.get(item.productId)
          if (!product) throw new Error('Product not found')
          if (item.expectedUnitPriceCentavos !== undefined &&
              item.expectedUnitPriceCentavos !== product.unitPriceCentavos) {
            throw new Error('Product price changed. Review the sale again')
          }
          const pool = await businessDb.inventoryPools.get(product.inventoryPoolId)
          if (!pool) throw new Error('Inventory pool not found')
          if (!Number.isSafeInteger(pool.stockQuantity) || pool.stockQuantity < 0 ||
              !Number.isSafeInteger(product.unitPriceCentavos) || product.unitPriceCentavos < 1) {
            throw new Error('Invalid stored stock or price')
          }
          if (product.inventoryUnitsPerSale !== 1) throw new Error('Unsupported inventory consumption rule')
          const beforeQuantity = remainingByPool.get(pool.id) ?? pool.stockQuantity
          if (beforeQuantity < item.quantity) {
            throw new Error('Insufficient stock')
          }

          const lineTotalCentavos = product.unitPriceCentavos * item.quantity
          totalCentavos += lineTotalCentavos
          if (!Number.isSafeInteger(lineTotalCentavos) || !Number.isSafeInteger(totalCentavos)) {
            throw new Error('Sale amount exceeds supported limit')
          }

          const afterQuantity = beforeQuantity - item.quantity
          remainingByPool.set(pool.id, afterQuantity)
          lineItems.push({
            saleId: sale.id,
            productId: product.id,
            productNameSnapshot: product.name,
            inventoryPoolId: pool.id,
            poolNameSnapshot: pool.name,
            inventoryUnitsPerSale: 1,
            quantity: item.quantity,
            unitPriceCentavos: product.unitPriceCentavos,
            lineTotalCentavos,
          })
          movements.push({
            productId: product.id,
            inventoryPoolId: pool.id,
            poolNameSnapshot: pool.name,
            saleId: sale.id,
            type: 'sale',
            delta: -item.quantity,
            beforeQuantity,
            afterQuantity,
            occurredAt: sale.confirmedAt,
          })
        }

        const confirmedSale = { ...sale, totalCentavos }
        await businessDb.sales.add(confirmedSale)
        await businessDb.saleItems.bulkAdd(lineItems)

        for (const [poolId, stockQuantity] of remainingByPool) {
          await businessDb.inventoryPools.update(poolId, { stockQuantity })
          await businessDb.products.where('inventoryPoolId').equals(poolId).modify({ stockQuantity })
        }

        await businessDb.inventoryMovements.bulkAdd(movements)
        await businessDb.auditEvents.add({
          saleId: sale.id,
          type: 'sale_completed',
          occurredAt: sale.confirmedAt,
          payload: {
            paymentMethod: sale.paymentMethod,
            totalCentavos,
            items: lineItems,
            movements,
          },
        })
        return { sale: confirmedSale, duplicate: false }
      },
    )
  },
}
}

export const businessRepository = createBusinessRepository(businessDb)
