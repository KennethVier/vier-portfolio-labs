import { describe, expect, it } from 'vitest'

import { WORKSPACE_STORAGE_KEY } from '../constants/businessConstants.js'
import { getActiveWorkspace, setActiveWorkspace } from './workspacePreference.js'

function fakeStorage() {
  const state = new Map()
  return {
    getItem: (key) => state.get(key) ?? null,
    setItem: (key, value) => state.set(key, value),
  }
}

describe('workspace preference', () => {
  it('defaults existing installs to Personal without changing stored data', () => {
    expect(getActiveWorkspace(fakeStorage())).toBe('personal')
  })

  it('remembers Business and supports switching back', () => {
    const storage = fakeStorage()
    expect(setActiveWorkspace('business', storage)).toBe(true)
    expect(storage.getItem(WORKSPACE_STORAGE_KEY)).toBe('business')
    expect(getActiveWorkspace(storage)).toBe('business')
    setActiveWorkspace('personal', storage)
    expect(getActiveWorkspace(storage)).toBe('personal')
  })

  it('rejects unsupported modes', () => {
    expect(() => setActiveWorkspace('unknown', fakeStorage())).toThrow('Invalid workspace')
  })
})
