export const FIRST_USE_WELCOME_KEY = 'pesopilot:first-use-welcome-dismissed'
export const PAGE_HELPER_PREFIX = 'pesopilot:page-helper-dismissed'

function getStorage(storage) {
  return storage ?? globalThis.localStorage ?? null
}

export function getPageHelperKey(pageKey) {
  return `${PAGE_HELPER_PREFIX}:${pageKey}`
}

export function isStorageFlagSet(key, { storage } = {}) {
  const localStorage = getStorage(storage)

  if (!localStorage) {
    return false
  }

  return localStorage.getItem(key) === 'true'
}

export function setStorageFlag(key, { storage } = {}) {
  const localStorage = getStorage(storage)

  if (!localStorage) {
    return
  }

  localStorage.setItem(key, 'true')
}
