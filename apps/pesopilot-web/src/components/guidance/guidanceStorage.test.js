import { describe, expect, it } from 'vitest'

import {
  FIRST_USE_WELCOME_KEY,
  getPageHelperKey,
  isStorageFlagSet,
  setStorageFlag,
} from './guidanceStorage.js'

function createStorage() {
  const values = new Map()

  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  }
}

describe('guidanceStorage', () => {
  it('builds stable page helper keys', () => {
    expect(getPageHelperKey('dashboard')).toBe(
      'pesopilot:page-helper-dismissed:dashboard',
    )
  })

  it('persists dismissal flags', () => {
    const storage = createStorage()

    expect(isStorageFlagSet(FIRST_USE_WELCOME_KEY, { storage })).toBe(false)

    setStorageFlag(FIRST_USE_WELCOME_KEY, { storage })

    expect(isStorageFlagSet(FIRST_USE_WELCOME_KEY, { storage })).toBe(true)
  })
})
