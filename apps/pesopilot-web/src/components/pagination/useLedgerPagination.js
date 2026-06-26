import { useEffect, useMemo, useRef, useState } from 'react'

import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
  clampPage,
  getPageCount,
  getPaginationRange,
  paginateItems,
  readStoredPageState,
} from './paginationUtils.js'

function getStorage() {
  return globalThis.sessionStorage ?? null
}

export function useLedgerPagination({
  items,
  resetKey,
  storageKey,
}) {
  const storage = getStorage()
  const pageKey = `${storageKey}:page`
  const pageSizeKey = `${storageKey}:pageSize`
  const [page, setPage] = useState(() =>
    readStoredPageState(storage, pageKey, 1),
  )
  const [pageSize, setPageSize] = useState(() =>
    readStoredPageState(
      storage,
      pageSizeKey,
      DEFAULT_PAGE_SIZE,
      PAGE_SIZE_OPTIONS,
    ),
  )
  const initialResetKey = useRef(resetKey)

  useEffect(() => {
    storage?.setItem(pageKey, String(page))
  }, [page, pageKey, storage])

  useEffect(() => {
    storage?.setItem(pageSizeKey, String(pageSize))
  }, [pageSize, pageSizeKey, storage])

  useEffect(() => {
    if (initialResetKey.current === resetKey) {
      return
    }

    initialResetKey.current = resetKey
    setPage(1)
  }, [resetKey])

  const total = items.length
  const pageCount = getPageCount(total, pageSize)
  const clampedPage = clampPage(page, total, pageSize)

  useEffect(() => {
    if (clampedPage !== page) {
      setPage(clampedPage)
    }
  }, [clampedPage, page])

  const paginatedItems = useMemo(
    () => paginateItems(items, clampedPage, pageSize),
    [items, clampedPage, pageSize],
  )
  const range = getPaginationRange(total, clampedPage, pageSize)

  function handlePageChange(nextPage) {
    setPage(clampPage(nextPage, total, pageSize))
  }

  function handlePageSizeChange(nextPageSize) {
    const parsedPageSize = Number(nextPageSize)
    const safePageSize = PAGE_SIZE_OPTIONS.includes(parsedPageSize)
      ? parsedPageSize
      : DEFAULT_PAGE_SIZE

    setPageSize(safePageSize)
    setPage((currentPage) => clampPage(currentPage, total, safePageSize))
  }

  return {
    page: clampedPage,
    pageCount,
    pageSize,
    paginatedItems,
    range,
    setPage: handlePageChange,
    setPageSize: handlePageSizeChange,
    showPagination: total > 0,
    total,
  }
}
