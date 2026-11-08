// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { ProductPhotoManager } from './ProductPhotoManager.jsx'
import { fixturePhoto } from '../services/productPhotoFixture.js'
import { productFamilyId } from '../constants/productPresentation.js'

globalThis.IS_REACT_ACT_ENVIRONMENT = true
let container
let root
let uploadPhoto
let removePhoto
const products = [{ id: 'solo', name: 'Solo', catalog: { family: 'Rub', category: 'Hallelujah Rub', type: 'Solo' } },
  { id: 'set', name: 'Set', catalog: { family: 'Rub', category: 'Hallelujah Rub', type: 'Set' } }]
const familyId = productFamilyId(products[0])
async function render(photos = []) {
  await act(async () => root.render(<ProductPhotoManager products={products} photos={photos} uploadPhoto={uploadPhoto} removePhoto={removePhoto} />))
}
async function select(file) {
  await act(async () => {
    const input = container.querySelector('input[type="file"]')
    Object.defineProperty(input, 'files', { configurable: true, value: [file] })
    input.dispatchEvent(new Event('change', { bubbles: true }))
  })
}
beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  uploadPhoto = vi.fn().mockResolvedValue(undefined)
  removePhoto = vi.fn().mockResolvedValue(undefined)
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:photo-preview')
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.restoreAllMocks()
})

it('shows one optional photo editor for a family and supports add, replace and remove actions', async () => {
  await render()
  expect(container.querySelectorAll('article')).toHaveLength(1)
  expect(container.querySelector('img')).toBeNull()
  expect(container.textContent).toContain('Add product photo')
  const photoFile = new File(['pixels'], 'rub.png', { type: 'image/png' })
  await select(photoFile)
  expect(uploadPhoto).toHaveBeenCalledWith(photoFile, familyId)
  expect(container.textContent).toContain('Photo saved on this device')
  await render([fixturePhoto(familyId)])
  expect(container.querySelector('img').alt).toBe('Rub product photo')
  expect(container.textContent).toContain('Replace photo')
  await select(photoFile)
  expect(uploadPhoto).toHaveBeenCalledTimes(2)
  await act(async () => [...container.querySelectorAll('button')].find((button) => button.textContent === 'Remove photo').click())
  expect(removePhoto).toHaveBeenCalledWith(familyId)
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:photo-preview')
})

it('previews immediately during save, blocks duplicate inputs and releases the preview after failure', async () => {
  let reject
  uploadPhoto.mockImplementation(() => new Promise((_, fail) => { reject = fail }))
  await render()
  await select(new File(['pixels'], 'rub.webp', { type: 'image/webp' }))
  expect(container.querySelector('img').getAttribute('src')).toBe('blob:photo-preview')
  expect(container.querySelector('input[type="file"]').disabled).toBe(true)
  await act(async () => reject(new Error('Storage full. Try a smaller photo.')))
  expect(container.querySelector('[role="alert"]').textContent).toContain('Storage full')
  expect(container.querySelector('img')).toBeNull()
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:photo-preview')
})

it('reports invalid type and size without changing or uploading the existing photo', async () => {
  await render([fixturePhoto(familyId)])
  await select(new File(['script'], 'photo.svg', { type: 'image/svg+xml' }))
  expect(container.querySelector('[role="alert"]').textContent).toContain('JPEG, PNG or WebP')
  await select({ type: 'image/png', size: 2 * 1024 * 1024 + 1 })
  expect(container.querySelector('[role="alert"]').textContent).toContain('2 MiB')
  expect(uploadPhoto).not.toHaveBeenCalled()
  expect(container.querySelector('img').getAttribute('src')).toBe(fixturePhoto(familyId).dataUrl)
})

it('switches to sample photo management without showing actual photos', async () => {
  await render([fixturePhoto(familyId)])
  await act(async () => [...container.querySelectorAll('button')].find((button) => button.textContent === 'Sample photos').click())
  expect(container.textContent).toContain('No sample products')
  expect(container.querySelector('img')).toBeNull()
})
