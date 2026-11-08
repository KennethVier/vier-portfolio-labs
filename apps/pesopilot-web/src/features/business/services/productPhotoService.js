import { PRODUCT_PHOTO_MAX_INPUT, PRODUCT_PHOTO_MAX_BYTES, PRODUCT_PHOTO_MAX_EDGE } from '../constants/productPresentation.js'
import { productPhotoRepository } from '../repositories/productPhotoRepository.js'
import { validateProductPhoto } from './productPhotoValidation.js'

export function validatePhotoFile(file) {
  if (!file || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Choose a JPEG, PNG or WebP image.')
  }
  if (file.size <= 0 || file.size > PRODUCT_PHOTO_MAX_INPUT) {
    throw new Error('Choose an image up to 2 MiB. Export a smaller photo from Photos or Files and try again.')
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('This photo could not be read. Choose a different JPEG, PNG or WebP image.'))
    image.src = src
  })
}

// Decode imported pixels before replacement, outside the Dexie write transaction.
// This also rejects malformed JPEG data and forged dimensions in backup metadata.
export async function verifyPhotoPixels(photo) {
  const image = await loadImage(photo.dataUrl)
  if (image.naturalWidth !== photo.width || image.naturalHeight !== photo.height) {
    throw new Error('Product photo dimensions do not match. No records were replaced.')
  }
}

export async function processProductPhoto(file, familyId) {
  validatePhotoFile(file)
  const url = URL.createObjectURL(file)
  try {
    const image = await loadImage(url)
    if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth * image.naturalHeight > 32_000_000) {
      throw new Error('Choose a photo with at most 32 megapixels.')
    }
    const scale = Math.min(1, PRODUCT_PHOTO_MAX_EDGE / Math.max(image.naturalWidth, image.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Photo processing is unavailable on this device.')
    context.fillStyle = '#FFFFFF'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    for (const quality of [0.85, 0.72, 0.6]) {
      const dataUrl = canvas.toDataURL('image/jpeg', quality)
      const byteLength = atob(dataUrl.split(',')[1] ?? '').length
      if (byteLength <= PRODUCT_PHOTO_MAX_BYTES) return validateProductPhoto({
        familyId, mimeType: 'image/jpeg', width: canvas.width, height: canvas.height, byteLength, dataUrl,
      })
    }
    throw new Error('This photo is too detailed to store. Choose a smaller or simpler photo.')
  } finally { URL.revokeObjectURL(url) }
}

export const productPhotoService = {
  list: () => productPhotoRepository.list(),
  async upload(file, familyId) {
    const photo = await processProductPhoto(file, familyId)
    await productPhotoRepository.save(photo)
    return photo
  },
  remove: (familyId) => productPhotoRepository.remove(familyId),
}
