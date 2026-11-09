import { CATALOG_CATEGORIES, PRODUCT_SCENTS } from '../constants/catalogMetadata.js'
import { businessRepository } from '../repositories/businessRepository.js'
import { businessService } from './businessService.js'

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
  PRODUCT_SCENTS.forEach((scent) => add('Hallelujah Inhaler', 'Hallelujah Inhaler', 99, { scent }))
  CATALOG_CATEGORIES.slice(2, 6).forEach((family) => PRODUCT_SCENTS.forEach((scent) => {
    add(family, family, 199, { scent, type: 'Solo' })
    add(family, family, 150, { scent, type: 'Set' })
  }))
  ;[['16x16 Throw Pillow', 499], ['17x24 Junior Size', 699], ['18x28 Queen Size', 799], ['20x30 King Size', 899]].forEach(([size, price]) => {
    add('Magic Pillows', 'Magic Pillows', price, { size })
  })
  return entries
}

export async function populateCatalog(legacy = false) {
  for (const entry of createSampleCatalog()) {
    const { sampleKey, ...catalog } = entry.catalog
    if (legacy) {
      await businessRepository.addProduct({ ...entry, id: sampleKey, inventoryPoolId: sampleKey,
        inventoryPoolName: 'Sample · ' + entry.name, inventoryUnitsPerSale: 1, stockQuantity: 20,
        initialNameSnapshot: entry.name, initialPriceCentavos: entry.unitPriceCentavos, createdAt: new Date().toISOString() })
    } else {
      await businessService.addProduct({ name: entry.name, catalog, pricePesos: String(entry.unitPriceCentavos / 100), openingStock: 20 })
    }
  }
}
