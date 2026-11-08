import { z } from 'zod'
import { PRODUCT_PHOTO_MAX_BYTES, PRODUCT_PHOTO_MAX_EDGE } from '../constants/productPresentation.js'

export const productPhotoSchema = z.object({
  familyId: z.string().min(1).max(2000),
  mimeType: z.literal('image/jpeg'),
  width: z.number().int().min(1).max(PRODUCT_PHOTO_MAX_EDGE),
  height: z.number().int().min(1).max(PRODUCT_PHOTO_MAX_EDGE),
  byteLength: z.number().int().min(1).max(PRODUCT_PHOTO_MAX_BYTES),
  dataUrl: z.string().max(Math.ceil(PRODUCT_PHOTO_MAX_BYTES / 3) * 4 + 23),
}).strict().refine((photo) => {
  if (!/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(photo.dataUrl)) return false
  const encoded = photo.dataUrl.slice(23)
  if (encoded.length % 4 !== 0) return false
  try {
    const bytes = atob(encoded)
    if (bytes.length !== photo.byteLength || bytes.charCodeAt(0) !== 255 || bytes.charCodeAt(1) !== 216 ||
      bytes.charCodeAt(bytes.length - 2) !== 255 || bytes.charCodeAt(bytes.length - 1) !== 217) return false
    // Inspect JPEG frame dimensions before invoking the browser decoder on an import.
    // A forged tiny metadata size cannot cause decoding a huge compressed image.
    const at = (index) => bytes.charCodeAt(index)
    let offset = 2
    while (offset + 8 < bytes.length) {
      if (at(offset) !== 255) return false
      while (at(offset) === 255) offset += 1
      const marker = at(offset++)
      if (marker === 218 || marker === 217) return false
      const length = at(offset) * 256 + at(offset + 1)
      if (length < 2 || offset + length > bytes.length) return false
      if ([192, 193, 194].includes(marker)) {
        return length >= 8 && at(offset + 3) * 256 + at(offset + 4) === photo.height &&
          at(offset + 5) * 256 + at(offset + 6) === photo.width
      }
      offset += length
    }
    return false
  } catch { return false }
}, 'Invalid product photo encoding or size')

export function validateProductPhoto(photo) {
  const parsed = productPhotoSchema.safeParse(photo)
  if (!parsed.success) throw new Error('Invalid product photo. Choose a JPEG, PNG or WebP image up to 2 MiB.')
  return parsed.data
}
