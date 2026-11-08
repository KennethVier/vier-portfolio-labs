import { businessDb } from './businessDb.js'

export const businessRepository = {
  listProducts() {
    return businessDb.products.orderBy('name').toArray()
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
      businessDb.inventoryMovements,
      businessDb.auditEvents,
      async () => {
        await businessDb.products.add(product)
        if (product.stockQuantity > 0) {
          const movement = {
            productId: product.id,
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
      businessDb.inventoryMovements,
      businessDb.auditEvents,
      async () => {
        const product = await businessDb.products.get(productId)
        if (!product) throw new Error('Product not found')
        const afterQuantity = product.stockQuantity + delta
        if (!Number.isSafeInteger(afterQuantity)) throw new Error('Stock limit exceeded')
        if (afterQuantity < 0) throw new Error('Insufficient stock')
        const movement = {
          productId,
          saleId: null,
          type: 'stock_adjustment',
          delta,
          reason,
          beforeQuantity: product.stockQuantity,
          afterQuantity,
          occurredAt,
        }
        await businessDb.products.update(productId, { stockQuantity: afterQuantity })
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

        for (const item of items) {
          const product = await businessDb.products.get(item.productId)
          if (!product) throw new Error('Product not found')
          if (item.expectedUnitPriceCentavos !== undefined &&
              item.expectedUnitPriceCentavos !== product.unitPriceCentavos) {
            throw new Error('Product price changed. Review the sale again')
          }
          if (product.stockQuantity < item.quantity) {
            throw new Error('Insufficient stock')
          }

          const lineTotalCentavos = product.unitPriceCentavos * item.quantity
          totalCentavos += lineTotalCentavos
          if (!Number.isSafeInteger(lineTotalCentavos) || !Number.isSafeInteger(totalCentavos)) {
            throw new Error('Sale amount exceeds supported limit')
          }

          const afterQuantity = product.stockQuantity - item.quantity
          lineItems.push({
            saleId: sale.id,
            productId: product.id,
            productNameSnapshot: product.name,
            quantity: item.quantity,
            unitPriceCentavos: product.unitPriceCentavos,
            lineTotalCentavos,
          })
          movements.push({
            productId: product.id,
            saleId: sale.id,
            type: 'sale',
            delta: -item.quantity,
            beforeQuantity: product.stockQuantity,
            afterQuantity,
            occurredAt: sale.confirmedAt,
          })
        }

        const confirmedSale = { ...sale, totalCentavos }
        await businessDb.sales.add(confirmedSale)
        await businessDb.saleItems.bulkAdd(lineItems)

        for (const movement of movements) {
          await businessDb.products.update(movement.productId, {
            stockQuantity: movement.afterQuantity,
          })
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
