import { CATALOG_CATEGORIES, SAMPLE_SCENTS } from '../constants/catalogMetadata.js'
import { businessRepository } from '../repositories/businessRepository.js'

export function createSampleCatalog() {
  const entries = []
  function add(category, family, price, options = {}) {
    const key = [family, options.scent, options.type, options.size].filter(Boolean).join('-').toLowerCase().replace(/[^a-z0-9]+/g, '-')
    entries.push({
      name: options.size ?? [family, options.scent, options.type].filter(Boolean).join(' · '),
      unitPriceCentavos: price * 100,
      catalog: { category, family, ...options, sampleKey: `pos-demo-v1-${key}` },
    })
  }
  ;[['Shawl A', 99], ['Shawl B', 199], ['Shawl C', 299]].forEach(([name, price]) => add('Shawls', name, price))
  SAMPLE_SCENTS.forEach((scent) => add('Hallelujah Inhaler', 'Hallelujah Inhaler', 99, { scent }))
  CATALOG_CATEGORIES.slice(2, 6).forEach((family) => SAMPLE_SCENTS.forEach((scent) => {
    add(family, family, 199, { scent, type: 'Solo' })
    add(family, family, 150, { scent, type: 'Set' })
  }))
  ;[['16x16 Throw Pillow', 499], ['17x24 Junior Size', 699], ['18x28 Queen Size', 799], ['20x30 King Size', 899]].forEach(([size, price]) => {
    add('Magic Pillows', 'Magic Pillows', price, { size })
  })
  return entries
}

export const posCatalogService = {
  async loadSampleCatalog(ownerConfirmed) {
    if (!import.meta.env.DEV) throw new Error('Sample catalog is available only in development.')
    if (ownerConfirmed !== true) throw new Error('Confirm fictional sample stock before loading.')
    const createdAt = new Date().toISOString()
    const products = createSampleCatalog().map((entry) => {
      const id = entry.catalog.sampleKey
      return { ...entry, id, initialNameSnapshot: entry.name, initialPriceCentavos: entry.unitPriceCentavos,
        inventoryPoolId: id, inventoryPoolName: `Sample · ${entry.name}`, inventoryUnitsPerSale: 1,
        stockQuantity: 20, createdAt }
    })
    return businessRepository.addSampleCatalog(products)
  },

  families(products, { category = 'All Products', search = '', sample = false } = {}) {
    const groups = new Map()
    const term = search.trim().toLowerCase()
    for (const product of products) {
      if (Boolean(product.catalog?.sampleKey) !== sample) continue
      const metadata = product.catalog
      const productCategory = metadata?.category ?? 'Other Products'
      if (category !== 'All Products' && category !== productCategory) continue
      // Old products remain independently selectable; their names are never parsed.
      const key = metadata ? JSON.stringify([productCategory, metadata.family]) : product.id
      if (!groups.has(key)) groups.set(key, { id: key, name: metadata?.family ?? product.name, category: productCategory, sample, products: [] })
      groups.get(key).products.push(product)
    }
    return [...groups.values()].filter((family) => !term || [family.name, family.category,
      ...family.products.flatMap((product) => [product.name, product.catalog?.scent, product.catalog?.size, product.catalog?.type])
    ].filter(Boolean).join(' ').toLowerCase().includes(term))
  },
}
