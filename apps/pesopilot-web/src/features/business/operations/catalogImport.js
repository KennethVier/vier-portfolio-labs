import { findDuplicateProduct } from '../constants/productCatalog.js'
import { BUSINESS_REALM, businessAdmin } from './branchRepository.js'

// Definitions only. Stock, photos, sales and audit records never enter this plan.
function definition(product) {
  const keys = [
    'id',
    'name',
    'unitPriceCentavos',
    'inventoryPoolId',
    'inventoryPoolName',
    'inventoryUnitsPerSale',
    'createdAt',
    'initialNameSnapshot',
    'initialPriceCentavos',
    'unitCostCentavos',
    'catalog',
    'legacyMetadata',
  ]
  return Object.fromEntries(
    keys
      .filter((key) => product[key] !== undefined)
      .map((key) => [key, product[key]]),
  )
}
export function catalogImportPlan(products, catalog) {
  const source = products
    .map(definition)
    .sort((a, b) => String(a.id).localeCompare(String(b.id)))
  const existing = catalog
    .map((product) => ({ ...definition(product), realmId: product.realmId }))
    .sort((a, b) => String(a.id).localeCompare(String(b.id)))
  const seen = new Set()
  const proposed = [...catalog]
  const rows = source.map((product) => {
    let status = 'new',
      reason = 'Add to the product list; branch stock starts at zero.'
    const saved = catalog.find((row) => row.id === product.id)
    if (
      !product.id ||
      !product.name?.trim() ||
      !product.inventoryPoolId ||
      !Number.isSafeInteger(product.unitPriceCentavos) ||
      product.unitPriceCentavos < 1 ||
      !Number.isFinite(Date.parse(product.createdAt)) ||
      product.inventoryUnitsPerSale !== 1 ||
      product.catalog?.sampleKey
    ) {
      status = 'conflict'
      reason = 'This product needs owner review before import.'
    } else if (seen.has(product.id)) {
      status = 'conflict'
      reason = 'The source contains a repeated product ID.'
    } else if (saved) {
      if (
        saved.realmId !== BUSINESS_REALM ||
        saved.inventoryPoolId !== product.inventoryPoolId ||
        saved.name !== product.name
      ) {
        status = 'conflict'
        reason =
          'This product differs from the saved definition. Nothing will be overwritten.'
      } else {
        status = 'existing'
        reason = 'Already in the product list. Keep its saved price and stock.'
      }
    } else if (findDuplicateProduct(proposed, product)) {
      status = 'conflict'
      reason =
        'This product or scent already exists under another ID. Review it before import.'
    }
    seen.add(product.id)
    if (status === 'new') proposed.push(product)
    return {
      product,
      status,
      reason,
      priceCentavos: saved?.unitPriceCentavos ?? product.unitPriceCentavos,
    }
  })
  return {
    source,
    rows,
    snapshot: JSON.stringify([source, existing]),
    added: rows.filter((row) => row.status === 'new').length,
    existing: rows.filter((row) => row.status === 'existing').length,
    conflicts: rows.filter((row) => row.status === 'conflict').length,
  }
}
export async function previewCatalogImport(database, userId, products) {
  return database.transaction(
    'r',
    database.branchCatalog,
    database.realms,
    database.members,
    async () => {
      if (!(await businessAdmin(database, userId)))
        throw new Error('Admin access is required to import products.')
      return catalogImportPlan(
        products,
        await database.branchCatalog
          .where('realmId')
          .equals(BUSINESS_REALM)
          .toArray(),
      )
    },
  )
}
