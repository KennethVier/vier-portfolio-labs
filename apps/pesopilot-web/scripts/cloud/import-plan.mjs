import { validateBusinessBackup } from '../../src/features/business/services/businessBackupValidation.js'

export function mapBackup(input) {
  const { stores } = validateBusinessBackup(input)
  const categories = new Set(stores.products.map((p) => p.catalog?.category).filter(Boolean))
  return {
    business_categories: [...categories].map((name) => ({ name })),
    business_pools: stores.inventoryPools.map((p) => ({
      id: p.id,
      name: p.name,
      quantity: p.stockQuantity,
      created_at: p.createdAt,
    })),
    business_products: stores.products.map((p) => ({
      id: p.id,
      pool_id: p.inventoryPoolId,
      name: p.name,
      price_centavos: p.unitPriceCentavos,
      category: p.catalog?.category,
      family: p.catalog?.family,
      scent: p.catalog?.scent,
      size: p.catalog?.size,
      variant_type: p.catalog?.type,
      original: p,
    })),
    business_sales: stores.sales.map((s) => ({
      id: s.id,
      request_key: s.requestKey,
      payment_method: s.paymentMethod,
      total_centavos: s.totalCentavos,
      confirmed_at: s.confirmedAt,
    })),
    business_sale_items: stores.saleItems.map((i) => ({
      id: i.id,
      sale_id: i.saleId,
      product_id: i.productId,
      pool_id: i.inventoryPoolId,
      quantity: i.quantity,
      original: i,
    })),
    business_movements: stores.inventoryMovements.map((m) => ({
      id: m.id,
      sale_id: m.saleId,
      product_id: m.productId,
      pool_id: m.inventoryPoolId,
      delta: m.delta,
      original: m,
    })),
    business_events: stores.auditEvents.map((e) => ({ id: e.id, sale_id: e.saleId, original: e })),
  }
}

export async function validateImport(db, tables) {
  return db.transaction(async (tx) => {
    const counts = {}
    for (const [table, rows] of Object.entries(tables)) {
      for (const row of rows) {
        const columns = Object.keys(row)
        const placeholders = columns.map((_, index) => '$' + (index + 1))
        await tx.query(
          `insert into recovery.${table} (${columns}) values (${placeholders})`,
          Object.values(row).map((v) =>
            typeof v === 'object' && v !== null ? JSON.stringify(v) : (v ?? null),
          ),
        )
      }
      const {
        rows: [result],
      } = await tx.query(`select count(*)::integer as count from recovery.${table}`)
      if (result.count !== rows.length) throw new Error('Count mismatch in ' + table)
      counts[table] = result.count
    }
    return counts
  })
}
