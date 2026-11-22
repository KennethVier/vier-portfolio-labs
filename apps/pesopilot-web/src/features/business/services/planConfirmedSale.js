// Shared accounting planner for the legacy repository and branch ledger. No persistence.
export function planConfirmedSale(
  sale,
  items,
  products,
  pools,
  { requirePriceReason = false } = {},
) {
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

    const pricing =
      item.pricingProductId === undefined
        ? product
        : products.get(item.pricingProductId)
    if (
      !pricing ||
      (item.pricingProductId !== undefined &&
        (item.saleFormat !== 'set' ||
          pricing.catalog?.type !== 'Set' ||
          !product.catalog?.family ||
          pricing.catalog.family !== product.catalog.family ||
          pricing.catalog.category !== product.catalog.category ||
          product.catalog.type !== 'Solo'))
    )
      throw new Error('Choose a valid catalog price option for this product.')
    if (
      item.expectedPricingUnitPriceCentavos !== undefined &&
      item.expectedPricingUnitPriceCentavos !== pricing.unitPriceCentavos
    )
      throw new Error('Product price changed. Review the sale again')
    if (
      !Number.isSafeInteger(pricing.unitPriceCentavos) ||
      pricing.unitPriceCentavos < 1
    )
      throw new Error('Invalid stored catalog price option')
    const priceBasisCentavos = pricing.unitPriceCentavos
    const acceptedPrice = item.acceptedUnitPriceCentavos ?? priceBasisCentavos
    if (!Number.isSafeInteger(acceptedPrice) || acceptedPrice < 1)
      throw new Error('Invalid agreed price')
    const priceOverride = acceptedPrice !== priceBasisCentavos
    if (
      requirePriceReason &&
      priceOverride &&
      !item.priceOverrideReason?.trim()
    )
      throw new Error('Explain the agreed price before confirming this sale.')
    if (
      product.unitCostCentavos !== undefined &&
      (!Number.isSafeInteger(product.unitCostCentavos) ||
        product.unitCostCentavos < 0)
    )
      throw new Error('Invalid stored purchase cost')
    const unitPriceCentavos = acceptedPrice
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
      ...(requirePriceReason
        ? {
            catalogUnitPriceCentavos: product.unitPriceCentavos,
            priceBasisCentavos,
            priceOverride,
            ...(item.pricingProductId
              ? { pricingProductId: item.pricingProductId }
              : {}),
            ...(priceOverride
              ? { priceOverrideReason: item.priceOverrideReason.trim() }
              : {}),
          }
        : {}),
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
