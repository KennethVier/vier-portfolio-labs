import { CATALOG_CATEGORIES, PRODUCT_SCENTS } from '../constants/catalogMetadata.js'
import { SHAWL_OPTIONS, PILLOW_OPTIONS, PACKAGE_OPTIONS, findDuplicateProduct } from '../constants/productCatalog.js'
import { productCreationService } from './productCreationService.js'
import { businessDb } from '../repositories/businessDb.js'
import { businessRepository } from '../repositories/businessRepository.js'
import { businessService } from './businessService.js'

const selections = CATALOG_CATEGORIES.flatMap(category => {
  if (category === 'Shawls') return SHAWL_OPTIONS.map(({ name }) => ({ category, shawl: name }))
  if (category === 'Magic Pillows') return PILLOW_OPTIONS.map(({ size }) => ({ category, size }))
  return PRODUCT_SCENTS.flatMap(scent => category === 'Hallelujah Inhaler' ? [{ category, scent }] :
    PACKAGE_OPTIONS.map(({ type }) => ({ category, scent, type })))
})
export const stockPresets = selections.map(selection => productCreationService.preview(selection).input)

export function receiveDailyStock(entries) {
  return businessDb.transaction('rw', [businessDb.products, businessDb.inventoryPools, businessDb.inventoryMovements, businessDb.auditEvents], async () => {
    const rows = []
    for (const entry of entries) {
      if (!entry.presetName) { rows.push(entry); continue }
      const preset = stockPresets.find(item => item.name === entry.presetName)
      if (!preset) throw new Error('Choose a listed product.')
      const existing = findDuplicateProduct(await businessDb.products.toArray(), preset)
      const product = existing ?? await businessService.addProduct(preset)
      rows.push({ productId: product.id, quantity: entry.quantity })
    }
    return businessRepository.receiveStock(rows)
  })
}
