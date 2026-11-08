import { WORKSPACE_STORAGE_KEY } from '../constants/businessConstants.js'

export function getWorkspaceChoice(storage) {
  try {
    const value = (storage ?? globalThis.localStorage)?.getItem(WORKSPACE_STORAGE_KEY)
    return value === 'business' || value === 'personal' ? value : null
  } catch {
    return null
  }
}

export function getActiveWorkspace(storage) {
  return getWorkspaceChoice(storage) ?? 'personal'
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
