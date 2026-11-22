import {
  productFamilyId,
  PRODUCT_PHOTO_MAX_COUNT,
} from '../constants/productPresentation.js'
import { validateProductPhoto } from '../services/productPhotoValidation.js'
import { processProductPhoto } from '../services/productPhotoService.js'
import { BUSINESS_REALM, businessAdmin } from './branchRepository.js'
// One bounded family photo attached to an existing catalog definition: no new table/schema.
// Never reads or imports legacy device photos automatically.
export function catalogPhotos(catalog) {
  const photos = new Map()
  for (const product of [...catalog].sort((a, b) => a.id.localeCompare(b.id))) {
    if (!product.familyPhoto || photos.has(productFamilyId(product))) continue
    try {
      const photo = validateProductPhoto(product.familyPhoto)
      if (photo.familyId === productFamilyId(product))
        photos.set(photo.familyId, photo)
    } catch {
      /* Invalid media must not substitute stock or prevent ledger accounting. */
    }
  }
  return [...photos.values()]
}
export async function saveCatalogPhoto(database, userId, familyId, photo) {
  const validated = photo === null ? null : validateProductPhoto(photo)
  if (validated && validated.familyId !== familyId)
    throw new Error('Photo family does not match.')
  return database.transaction(
    'rw',
    database.branchCatalog,
    database.realms,
    database.members,
    async () => {
      if (!(await businessAdmin(database, userId)))
        throw new Error('Admin membership required.')
      const catalog = await database.branchCatalog
        .where('realmId')
        .equals(BUSINESS_REALM)
        .toArray()
      const family = catalog
        .filter(
          (product) =>
            productFamilyId(product) === familyId &&
            !product.catalog?.sampleKey,
        )
        .sort((a, b) => a.id.localeCompare(b.id))
      if (!family.length)
        throw new Error('This product family no longer exists.')
      if (
        validated &&
        !catalogPhotos(catalog).some((item) => item.familyId === familyId) &&
        catalogPhotos(catalog).length >= PRODUCT_PHOTO_MAX_COUNT
      )
        throw new Error(
          'This business supports 30 product photos. Remove an unused photo first.',
        )
      for (const product of family) {
        if (product === family[0] || product.familyPhoto)
          await database.branchCatalog.update(product.id, {
            familyPhoto:
              product === family[0] && validated ? validated : undefined,
          })
      }
    },
  )
}
export async function uploadCatalogPhoto(database, userId, file, familyId) {
  // Pixel decoding/resizing happens before the durable transaction, using Phase 0 validation.
  const photo = await processProductPhoto(file, familyId)
  await saveCatalogPhoto(database, userId, familyId, photo)
  return photo
}
