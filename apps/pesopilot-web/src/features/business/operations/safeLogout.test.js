import { expect, it, vi } from 'vitest'
import { safeBusinessLogout } from './safeLogout.js'
it('flushes pending provider writes before logout and keeps the session on a failed push', async () => {
  const database = {
    cloud: {
      sync: vi
        .fn()
        .mockRejectedValueOnce(new Error('sync rejected'))
        .mockResolvedValueOnce(),
      logout: vi.fn(),
    },
  }
  await expect(safeBusinessLogout(database)).rejects.toThrow('sync rejected')
  expect(database.cloud.logout).not.toHaveBeenCalled()
  await safeBusinessLogout(database)
  expect(database.cloud.sync).toHaveBeenCalledWith({
    purpose: 'push',
    wait: true,
  })
  expect(database.cloud.logout).toHaveBeenCalledWith()
})
it('does not invoke destructive logout when offline', async () => {
  vi.stubGlobal('navigator', { onLine: false })
  try {
    const database = { cloud: { sync: vi.fn(), logout: vi.fn() } }
    await expect(safeBusinessLogout(database)).rejects.toThrow(/Reconnect/)
    expect(database.cloud.logout).not.toHaveBeenCalled()
    expect(database.cloud.sync).not.toHaveBeenCalled()
  } finally {
    vi.unstubAllGlobals()
  }
})
