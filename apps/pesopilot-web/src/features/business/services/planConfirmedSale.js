// Shared accounting planner for the legacy repository and branch ledger. No persistence.
export function planConfirmedSale(sale, items, products, pools) {
  let totalCentavos = 0
  const lineItems = []
  const movements = []
  const remainingByPool = new Map()

  for (const item of items) {
    const product = products.get(item.productId)
    if (!product) throw new Error('Product not found')
    if (
      item.expectedUnitPriceCentavos !== undefined &&
      item.expectedUnitPriceCentavos !== product.unitPriceCentavos
    ) {
      throw new Error('Product price changed. Review the sale again')
    }
    const pool = pools.get(product.inventoryPoolId)
    if (!pool) throw new Error('Inventory pool not found')
    if (
      !Number.isSafeInteger(pool.stockQuantity) ||
      pool.stockQuantity < 0 ||
      !Number.isSafeInteger(product.unitPriceCentavos) ||
      product.unitPriceCentavos < 1
    ) {
      throw new Error('Invalid stored stock or price')
    }
    if (product.inventoryUnitsPerSale !== 1)
      throw new Error('Unsupported inventory consumption rule')
    const beforeQuantity = remainingByPool.get(pool.id) ?? pool.stockQuantity
    if (beforeQuantity < item.quantity) {
      throw new Error('Insufficient stock')
    }

    const unitPriceCentavos =
      item.acceptedUnitPriceCentavos ?? product.unitPriceCentavos
    const lineTotalCentavos = unitPriceCentavos * item.quantity
    totalCentavos += lineTotalCentavos
    if (
      !Number.isSafeInteger(lineTotalCentavos) ||
      !Number.isSafeInteger(totalCentavos)
    ) {
      throw new Error('Sale amount exceeds supported limit')
    }

    const afterQuantity = beforeQuantity - item.quantity
    remainingByPool.set(pool.id, afterQuantity)
    if (
      product.unitCostCentavos !== undefined &&
      !Number.isSafeInteger(product.unitCostCentavos * item.quantity)
    ) {
      throw new Error('Sale cost exceeds supported limit')
    }
    lineItems.push({
      saleId: sale.id,
      productId: product.id,
      productNameSnapshot: product.catalog?.sampleKey
        ? `Sample · ${product.name}`
        : product.name,
      inventoryPoolId: pool.id,
      poolNameSnapshot: pool.name,
      inventoryUnitsPerSale: 1,
      quantity: item.quantity,
      unitPriceCentavos,
      lineTotalCentavos,
      ...(item.saleFormat ? { saleFormat: item.saleFormat } : {}),
      ...(product.unitCostCentavos === undefined
        ? {}
        : { unitCostCentavos: product.unitCostCentavos }),
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

  return { confirmedSale, lineItems, movements, remainingByPool }
}
