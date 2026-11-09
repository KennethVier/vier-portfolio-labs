import { productFamilyId } from '../constants/productPresentation.js'

export const posCatalogService = {
  families(products, { category = 'All Products', search = '' } = {}) {
    const groups = new Map()
    const term = search.trim().toLowerCase()
    for (const product of products) {
      if (product.catalog?.sampleKey) continue
      const metadata = product.catalog
      const productCategory = metadata?.category ?? 'Other Products'
      if (category !== 'All Products' && category !== productCategory) continue
      // Old products remain independently selectable; their names are never parsed.
      const key = productFamilyId(product)
      if (!groups.has(key)) groups.set(key, { id: key, name: metadata?.family ?? product.name, category: productCategory, products: [] })
      groups.get(key).products.push(product)
    }
    return [...groups.values()].filter((family) => !term || [family.name, family.category,
      ...family.products.flatMap((product) => [product.name, product.catalog?.scent, product.catalog?.size, product.catalog?.type])
    ].filter(Boolean).join(' ').toLowerCase().includes(term))
  },
}
