import { describe, expect, it } from 'vitest'

import {
  clampPage,
  getAdjustedPageAfterDelete,
  getPageCount,
  getPaginationRange,
  paginateItems,
  readStoredPageState,
} from './paginationUtils.js'

const records = Array.from({ length: 55 }, (_, index) => ({ id: index + 1 }))

describe('paginationUtils', () => {
  it('paginates first, middle, and last pages', () => {
    expect(paginateItems(records, 1, 20).map((record) => record.id)).toEqual(
      Array.from({ length: 20 }, (_, index) => index + 1),
    )
    expect(paginateItems(records, 2, 20)[0].id).toBe(21)
    expect(paginateItems(records, 3, 20).map((record) => record.id)).toEqual(
      Array.from({ length: 15 }, (_, index) => index + 41),
    )
  })

  it('clamps invalid navigation', () => {
    expect(getPageCount(55, 20)).toBe(3)
    expect(clampPage(-1, 55, 20)).toBe(1)
    expect(clampPage(99, 55, 20)).toBe(3)
    expect(clampPage(3, 0, 20)).toBe(1)
  })

  it('builds result summary ranges', () => {
    expect(getPaginationRange(55, 2, 20)).toEqual({
      end: 40,
      label: 'Showing 21-40 of 55 records',
      start: 21,
    })
    expect(getPaginationRange(0, 1, 20)).toEqual({
      end: 0,
      label: 'Showing 0 of 0 records',
      start: 0,
    })
  })

  it('adjusts page after deleting the last item on the last page', () => {
    expect(getAdjustedPageAfterDelete(3, 40, 20)).toBe(2)
    expect(getAdjustedPageAfterDelete(2, 39, 20)).toBe(2)
  })

  it('reads valid persisted page state with fallbacks', () => {
    const storage = {
      getItem(key) {
        return {
          invalid: 'bad',
          page: '3',
          pageSize: '50',
          wrongSize: '25',
        }[key]
      },
    }

    expect(readStoredPageState(storage, 'page', 1)).toBe(3)
    expect(readStoredPageState(storage, 'invalid', 1)).toBe(1)
    expect(readStoredPageState(storage, 'pageSize', 20, [20, 50, 100])).toBe(50)
    expect(readStoredPageState(storage, 'wrongSize', 20, [20, 50, 100])).toBe(20)
  })
})
