// Family identity uses explicit catalog metadata, never a parsed product name.
// Source is part of the key so actual and fictional catalogs cannot share photos.
export function productFamilyId(product) {
  return product.catalog
    ? JSON.stringify([Boolean(product.catalog.sampleKey), product.catalog.category, product.catalog.family])
    : JSON.stringify(['product', product.id])
}

export const CATEGORY_SURFACES = {
  Shawls: '#F3EBDD',
  'Hallelujah Inhaler': '#EEF1E8',
  'Hallelujah Rub': '#F7EDE2',
  'Hallelujah Roll': '#EEEDF4',
  'Reigna Aroma Rub': '#F4E9E7',
  'Reigna Aroma Roll': '#EAF1EC',
  'Magic Pillows': '#F6EDDA',
}

export const PRODUCT_PHOTO_MAX_INPUT = 2 * 1024 * 1024
export const PRODUCT_PHOTO_MAX_BYTES = 192 * 1024
export const PRODUCT_PHOTO_MAX_EDGE = 960
export const PRODUCT_PHOTO_MAX_COUNT = 30
