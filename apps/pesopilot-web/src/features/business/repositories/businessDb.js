import Dexie from 'dexie'

// Separate from the personal 'pesopilot' database and its 13 approved stores.
// This schema belongs only to the proposed v1.1 Business Mode.
const originalStores = {
  products: 'id, name',
  sales: 'id, &requestKey, confirmedAt, paymentMethod',
  saleItems: '++id, saleId, productId',
  inventoryMovements: '++id, productId, saleId, occurredAt',
  auditEvents: '++id, saleId, occurredAt, type',
}

export function createBusinessDb(name = 'pesopilot-business') {
  const database = new Dexie(name)
  database.version(1).stores(originalStores)
  database.version(2).stores({
    ...originalStores,
    products: 'id, name, inventoryPoolId',
    inventoryPools: 'id, name, createdAt',
    inventoryMovements: '++id, productId, inventoryPoolId, saleId, occurredAt',
  }).upgrade(async (transaction) => {
    const products = await transaction.table('products').toArray()
    const byId = new Map(products.map((product) => [product.id, product]))
    // One pool per existing product: never combine or duplicate saved quantities.
    await transaction.table('inventoryPools').bulkAdd(products.map((product) => ({
      id: product.id, name: product.name, stockQuantity: product.stockQuantity,
      createdAt: product.createdAt,
    })))
    await transaction.table('products').toCollection().modify((product) => {
      product.inventoryPoolId = product.id
      product.inventoryUnitsPerSale = 1
      product.initialNameSnapshot = product.name
      product.initialPriceCentavos = product.unitPriceCentavos
      product.legacyMetadata = true
    })
    await transaction.table('inventoryMovements').toCollection().modify((movement) => {
      movement.inventoryPoolId = movement.productId
      movement.poolNameSnapshot = byId.get(movement.productId)?.name
    })
    await transaction.table('saleItems').toCollection().modify((item) => {
      item.inventoryPoolId = item.productId
      item.poolNameSnapshot = byId.get(item.productId)?.name ?? item.productNameSnapshot
      item.inventoryUnitsPerSale = 1
    })
  })
  // Additive media store: existing products, stock and historical snapshots stay intact.
  database.version(3).stores({ productPhotos: 'familyId' })
  return database
}

export const businessDb = createBusinessDb()
