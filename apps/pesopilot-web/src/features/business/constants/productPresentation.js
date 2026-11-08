// Family identity uses explicit catalog metadata, never a parsed product name.
// Source is part of the key so actual and fictional catalogs cannot share photos.
export function productFamilyId(product) {
  return product.catalog
    ? JSON.stringify([Boolean(product.catalog.sampleKey), product.catalog.category, product.catalog.family])
    : JSON.stringify(['product', product.id])
}

export const CATEGORY_SURFACES = {
  Shawls: '#EBF3FF',
  'Hallelujah Inhaler': '#E8F6EF',
  'Hallelujah Rub': '#FFF0E7',
  'Hallelujah Roll': '#F0EBFF',
  'Reigna Aroma Rub': '#FCECF1',
  'Reigna Aroma Roll': '#E5F7F3',
  'Magic Pillows': '#FFF4E2',
}

export const PRODUCT_PHOTO_MAX_INPUT = 2 * 1024 * 1024
export const PRODUCT_PHOTO_MAX_BYTES = 192 * 1024
export const PRODUCT_PHOTO_MAX_EDGE = 960
export const PRODUCT_PHOTO_MAX_COUNT = 30
