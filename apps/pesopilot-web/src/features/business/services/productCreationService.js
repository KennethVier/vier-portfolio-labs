import { catalogMetadataSchema } from '../constants/catalogMetadata.js'
import { PRODUCT_CATEGORIES, PRODUCT_SCENTS, SHAWL_OPTIONS, PILLOW_OPTIONS, PACKAGE_OPTIONS } from '../constants/productCatalog.js'
import { parsePriceCentavos } from './businessService.js'

export const productCreationService = {
  preview({ category, shawl, scent, type, size, name, price }) {
    try {
      if (!PRODUCT_CATEGORIES.includes(category)) throw new Error('Choose a Product Category to begin.')
      let productName
      let unitPriceCentavos
      let catalog
      if (category === 'Other product') {
        productName = typeof name === 'string' ? name.trim() : ''
        if (!productName || productName.length > 120) throw new Error('Enter a product name of up to 120 characters.')
        unitPriceCentavos = parsePriceCentavos(price)
      } else if (category === 'Shawls') {
        const option = SHAWL_OPTIONS.find((option) => option.name === shawl)
        if (!option) throw new Error('Choose a shawl.')
        productName = option.name
        unitPriceCentavos = option.priceCentavos
        catalog = { category, family: option.name }
      } else if (category === 'Magic Pillows') {
        const option = PILLOW_OPTIONS.find((option) => option.size === size)
        if (!option) throw new Error('Choose a pillow size.')
        productName = option.size
        unitPriceCentavos = option.priceCentavos
        catalog = { category, family: category, size: option.size }
      } else {
        if (!PRODUCT_SCENTS.includes(scent)) throw new Error('Choose a scent.')
        catalog = { category, family: category, scent }
        if (category === 'Hallelujah Inhaler') {
          unitPriceCentavos = 9900
        } else {
          const option = PACKAGE_OPTIONS.find((option) => option.type === type)
          if (!option) throw new Error('Choose Solo or Set.')
          catalog.type = option.type
          unitPriceCentavos = option.priceCentavos
        }
        productName = [category, scent, catalog.type].filter(Boolean).join(' · ')
      }
      return { unitPriceCentavos, input: { name: productName, pricePesos: (unitPriceCentavos / 100).toFixed(2),
        ...(catalog ? { catalog: catalogMetadataSchema.parse(catalog) } : {}) } }
    } catch (error) { return { error: error.message } }
  },
}
