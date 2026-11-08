import { CATALOG_CATEGORIES, SAMPLE_SCENTS } from './catalogMetadata.js'

export const PRODUCT_CATEGORIES = [...CATALOG_CATEGORIES, 'Other product']
export const PRODUCT_SCENTS = SAMPLE_SCENTS
export const SHAWL_OPTIONS = [
  { name: 'Shawl A', priceCentavos: 9900 },
  { name: 'Shawl B', priceCentavos: 19900 },
  { name: 'Shawl C', priceCentavos: 29900 },
]
export const PILLOW_OPTIONS = [
  { size: '16x16 Throw Pillow', label: '16×16 Throw Pillow', priceCentavos: 49900 },
  { size: '17x24 Junior Size', label: '17×24 Junior Size', priceCentavos: 69900 },
  { size: '18x28 Queen Size', label: '18×28 Queen Size', priceCentavos: 79900 },
  { size: '20x30 King Size', label: '20×30 King Size', priceCentavos: 89900 },
]
export const PACKAGE_OPTIONS = [
  { type: 'Solo', priceCentavos: 19900 },
  { type: 'Set', priceCentavos: 15000 },
]

const normalize = (value) => String(value ?? '').normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase()

function coordinates(product) {
  const catalog = product.catalog
  if (!catalog) return null
  // Older arbitrary families may have no option coordinates. Keep differently
  // named legacy products selectable instead of inventing missing dimensions.
  if (!catalog.scent && !catalog.type && !catalog.size &&
      !(catalog.category === 'Shawls' && SHAWL_OPTIONS.some((option) => option.name === catalog.family))) return null
  return JSON.stringify([catalog.category, catalog.family, catalog.scent, catalog.type, catalog.size].map(normalize))
}

export function findDuplicateProduct(products, candidate) {
  const key = coordinates(candidate)
  return products.find((saved) => {
    if (Boolean(saved.catalog?.sampleKey) !== Boolean(candidate.catalog?.sampleKey)) return false
    const savedKey = coordinates(saved)
    if (key && savedKey) return key === savedKey
    // Exact normalized complete names are a conservative legacy fallback;
    // never split names into metadata or infer stock relationships.
    return normalize(saved.name) === normalize(candidate.name)
  })
}

export function availableSharedStock(products) {
  const groups = new Map()
  for (const product of products) {
    if (!product.inventoryPoolId) continue
    if (!groups.has(product.inventoryPoolId)) groups.set(product.inventoryPoolId, [])
    groups.get(product.inventoryPoolId).push(product)
  }
  return [...groups.values()].filter((members) => members.every((product) => !product.catalog?.sampleKey &&
    typeof product.inventoryPoolId === 'string' && typeof product.inventoryPoolName === 'string' && product.inventoryPoolName.trim() &&
    Number.isSafeInteger(product.stockQuantity) && product.stockQuantity >= 0 &&
    product.stockQuantity === members[0].stockQuantity && product.inventoryPoolName === members[0].inventoryPoolName))
    .map((members) => members[0])
}
