export const DEFAULT_PAGE_SIZE = 20
export const PAGE_SIZE_OPTIONS = [20, 50, 100]

export function getPageCount(total, pageSize = DEFAULT_PAGE_SIZE) {
  if (total <= 0) {
    return 0
  }

  return Math.max(1, Math.ceil(total / pageSize))
}

export function clampPage(page, total, pageSize = DEFAULT_PAGE_SIZE) {
  const pageCount = getPageCount(total, pageSize)

  if (pageCount === 0) {
    return 1
  }

  return Math.min(Math.max(Number(page) || 1, 1), pageCount)
}

export function paginateItems(items, page, pageSize = DEFAULT_PAGE_SIZE) {
  const safePage = clampPage(page, items.length, pageSize)
  const startIndex = (safePage - 1) * pageSize

  return items.slice(startIndex, startIndex + pageSize)
}

export function getPaginationRange(total, page, pageSize = DEFAULT_PAGE_SIZE) {
  if (total <= 0) {
    return {
      end: 0,
      label: 'Showing 0 of 0 records',
      start: 0,
    }
  }

  const safePage = clampPage(page, total, pageSize)
  const start = (safePage - 1) * pageSize + 1
  const end = Math.min(start + pageSize - 1, total)

  return {
    end,
    label: `Showing ${start}-${end} of ${total} records`,
    start,
  }
}

export function getAdjustedPageAfterDelete(page, totalAfterDelete, pageSize) {
  return clampPage(page, totalAfterDelete, pageSize)
}

export function readStoredPageState(storage, key, fallback, allowedValues = null) {
  const storedValue = Number(storage?.getItem(key))

  if (!Number.isFinite(storedValue) || storedValue <= 0) {
    return fallback
  }

  if (allowedValues && !allowedValues.includes(storedValue)) {
    return fallback
  }

  return storedValue
}
