import { WORKSPACE_STORAGE_KEY } from '../constants/businessConstants.js'

export function getActiveWorkspace(storage = globalThis.localStorage) {
  try {
    return storage?.getItem(WORKSPACE_STORAGE_KEY) === 'business'
      ? 'business'
      : 'personal'
  } catch {
    return 'personal'
  }
}

export function setActiveWorkspace(value, storage = globalThis.localStorage) {
  if (value !== 'business' && value !== 'personal') {
    throw new Error('Invalid workspace')
  }

  try {
    storage?.setItem(WORKSPACE_STORAGE_KEY, value)
    return Boolean(storage)
  } catch {
    return false
  }
}
