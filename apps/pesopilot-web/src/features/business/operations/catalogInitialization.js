import { findDuplicateProduct } from '../constants/productCatalog.js'
import { stockPresets } from '../services/stockPresets.js'
import { BUSINESS_REALM, businessAdmin } from './branchRepository.js'
import { standardCatalogDefinitions } from './standardCatalog.js'
export const STANDARD_CATALOG_VERSION = 1
export function catalogInitializationState(catalog) {
  const marker = catalog.some(
    (row) => row.standardCatalogSetup?.version === STANDARD_CATALOG_VERSION,
  )
  const conflicts = stockPresets.filter(
    (preset) =>
      catalog.filter((row) => findDuplicateProduct([row], preset)).length > 1,
  ).length
  const missing = stockPresets.filter(
    (preset) => !findDuplicateProduct(catalog, preset),
  ).length
  return { initialized: marker, missing, conflicts }
}
// Called only after an authenticated pull. No local legacy store is consulted.
export async function initializeStandardCatalog(database, userId) {
  if (database.cloud?.options?.databaseUrl !== 'https://z5jxogiwe.dexie.cloud')
    throw new Error(
      'Standard setup is restricted to the approved development business.',
    )
  return database.transaction(
    'rw',
    database.branchCatalog,
    database.realms,
    database.members,
    async () => {
      const realm = await database.realms.get(BUSINESS_REALM)
      if (!(await businessAdmin(database, userId)) || realm?.owner !== userId)
        throw new Error(
          'Business owner access is required for initial product setup.',
        )
      const catalog = await database.branchCatalog
        .where('realmId')
        .equals(BUSINESS_REALM)
        .toArray()
      const state = catalogInitializationState(catalog)
      if (state.initialized) return { ...state, added: 0 }
      if (state.conflicts)
        throw Object.assign(
          new Error(
            'Some standard products have duplicate definitions. Owner review is needed; nothing was changed.',
          ),
          {
            code: 'CATALOG_DUPLICATES',
            productNames: stockPresets
              .filter(
                (preset) =>
                  catalog.filter((row) => findDuplicateProduct([row], preset))
                    .length > 1,
              )
              .map((preset) => preset.name),
          },
        )
      const definitions = standardCatalogDefinitions(catalog)
      const missing = definitions.filter(
        (row) => !catalog.some((saved) => saved.id === row.id),
      )
      // Detect deterministic-ID collisions instead of overwriting an unrelated/custom row.
      for (const preset of stockPresets) {
        const match = definitions.find((row) =>
          findDuplicateProduct([row], preset),
        )
        if (
          !match ||
          !match.catalog ||
          !match.inventoryPoolId ||
          match.inventoryUnitsPerSale !== 1
        )
          throw new Error(
            'Existing product details need owner review; nothing was changed.',
          )
        const stored = catalog.find((row) => row.id === match.id)
        if (stored && !findDuplicateProduct([stored], preset))
          throw new Error(
            'Existing product identifiers need owner review; nothing was changed.',
          )
      }
      for (const product of missing) {
        if (await database.branchCatalog.get(product.id))
          throw new Error(
            'Existing product identifiers need owner review; nothing was changed.',
          )
        await database.branchCatalog.add({
          ...product,
          realmId: BUSINESS_REALM,
          owner: realm.owner,
          stockQuantity: 0,
        })
      }
      const anchor = definitions[0]
      // Business-wide version marker on a real definition; ignored by stock projections.
      // Adds metadata only, preserving every existing field. No marker pseudo-product/store.
      await database.branchCatalog.update(anchor.id, {
        standardCatalogSetup: { version: STANDARD_CATALOG_VERSION },
      })
      return {
        initialized: true,
        missing: 0,
        conflicts: 0,
        added: missing.length,
      }
    },
  )
}
