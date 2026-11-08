import { businessDb } from './businessDb.js'
import { productFamilyId, PRODUCT_PHOTO_MAX_COUNT } from '../constants/productPresentation.js'

export const productPhotoRepository = {
  list: () => businessDb.productPhotos.toArray(),
  save(photo) {
    return businessDb.transaction('rw', businessDb.products, businessDb.productPhotos, async () => {
      const products = await businessDb.products.toArray()
      if (!products.some((product) => productFamilyId(product) === photo.familyId)) {
        throw new Error('This product family no longer exists. Reload Inventory.')
      }
      if (!await businessDb.productPhotos.get(photo.familyId) && await businessDb.productPhotos.count() >= PRODUCT_PHOTO_MAX_COUNT) {
        throw new Error('This workspace supports 30 product photos. Remove an unused photo first.')
      }
      await businessDb.productPhotos.put(photo)
    })
  },
  remove: (familyId) => businessDb.productPhotos.delete(familyId),
}
