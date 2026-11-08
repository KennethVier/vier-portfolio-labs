import { WORKSPACE_STORAGE_KEY } from '../constants/businessConstants.js'

export function getActiveWorkspace(storage) {
  try {
    const chosenStorage = storage ?? globalThis.localStorage
    return chosenStorage?.getItem(WORKSPACE_STORAGE_KEY) === 'business'
      ? 'business'
      : 'personal'
  } catch {
    return 'personal'
  }
}

export function setActiveWorkspace(value, storage) {
  if (value !== 'business' && value !== 'personal') {
    throw new Error('Invalid workspace')
  }

  try {
    const chosenStorage = storage ?? globalThis.localStorage
    chosenStorage?.setItem(WORKSPACE_STORAGE_KEY, value)
    return Boolean(chosenStorage)
  } catch {
    return false
  }
}
