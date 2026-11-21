// @vitest-environment happy-dom
import { it, expect, vi } from 'vitest'
vi.mock('./client.ts', () => ({
  db: {
    cloud: { version: '4.4.16', schema: { stock: { primaryKey: 'id' } } },
    table: () => ({ get: async () => ({ old: { primaryKey: 'id', accessToken: 'excluded' } }) }),
    tables: [],
  },
}))
import { captureNextSync } from './captureSchema.js'
it('captures serialized schema without issuing a request and forwards the original request and response', async () => {
  const originalLocation = window.location
  const fetcher = vi.fn().mockResolvedValue(new Response('', { status: 422 }))
  vi.stubGlobal('fetch', fetcher)
  vi.stubGlobal('location', { hostname: 'localhost' })
  let saved
  vi.stubGlobal('URL', URL)
  vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
    saved = blob
    return 'blob:metadata'
  })
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  try {
    captureNextSync()
    expect(fetcher).not.toHaveBeenCalled()
    const options = {
      method: 'POST',
      headers: { Authorization: 'Bearer private' },
      body: JSON.stringify({
        schema: { stock: { primaryKey: 'id', markedForSync: true }, old: { primaryKey: 'id' } },
        changes: [{ private: 'sales' }],
        accessToken: 'private',
      }),
    }
    const response = await window.fetch('https://z5jxogiwe.dexie.cloud/sync', options)
    expect(response.status).toBe(422)
    expect(fetcher).toHaveBeenCalledWith('https://z5jxogiwe.dexie.cloud/sync', options)
    const text = await saved.text()
    expect(text).not.toContain('private')
    expect(text).not.toContain('excluded')
    expect(JSON.parse(text).transmitted.old.primaryKey).toBe('id')
    expect(window.fetch).toBe(fetcher)
  } finally {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    window.location = originalLocation
  }
})
