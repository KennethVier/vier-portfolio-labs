import { stockPresets } from '../services/stockPresets.js'
import { findDuplicateProduct } from '../constants/productCatalog.js'
// Explicit owner-reviewed definitions, not seeded stock or historical sales.
export function standardCatalogDefinitions(
  catalog,
  createdAt = new Date().toISOString(),
) {
  const definitions = stockPresets.map((preset) => {
    const existing = findDuplicateProduct(catalog, preset)
    if (existing) return { ...existing }
    const id =
      'prd:' +
      JSON.stringify([
        preset.catalog.category,
        preset.catalog.family,
        preset.catalog.scent ?? '',
        preset.catalog.type ?? '',
        preset.catalog.size ?? '',
      ])
    const unitPriceCentavos = Math.round(Number(preset.pricePesos) * 100)
    return {
      id,
      name: preset.name,
      catalog: preset.catalog,
      unitPriceCentavos,
      initialNameSnapshot: preset.name,
      initialPriceCentavos: unitPriceCentavos,
      inventoryPoolId: id,
      inventoryPoolName: preset.name,
      inventoryUnitsPerSale: 1,
      createdAt,
    }
  })
  return definitions.map((product) => {
    if (
      catalog.some((saved) => saved.id === product.id) ||
      product.catalog?.type !== 'Set'
    )
      return product
    const solo = definitions.find(
      (row) =>
        row.catalog?.type === 'Solo' &&
        row.catalog.family === product.catalog.family &&
        row.catalog.category === product.catalog.category &&
        row.catalog.scent === product.catalog.scent,
    )
    if (!solo)
      throw new Error(
        'Review existing Solo product details before adding its Set option.',
      )
    return {
      ...product,
      inventoryPoolId: solo.inventoryPoolId,
      inventoryPoolName: solo.inventoryPoolName,
    }
  })
}
