import { describe, expect, it } from 'vitest'

import {
  filterRecordsByCurrentCutoff,
  isCurrentCutoffRecord,
} from './currentCutoffFilters.js'

describe('currentCutoffFilters', () => {
  it('matches records assigned to the current cutoff', () => {
    expect(isCurrentCutoffRecord({ cutoffId: 7 }, { id: 7 })).toBe(true)
    expect(isCurrentCutoffRecord({ cutoffId: '7' }, { id: 7 })).toBe(true)
  })

  it('excludes records without a current cutoff assignment', () => {
    expect(isCurrentCutoffRecord({ cutoffId: null }, { id: 7 })).toBe(false)
    expect(isCurrentCutoffRecord({ cutoffId: '' }, { id: 7 })).toBe(false)
    expect(isCurrentCutoffRecord({ cutoffId: 7 }, null)).toBe(false)
  })

  it('filters out historical and orphaned records', () => {
    expect(filterRecordsByCurrentCutoff([
      { id: 1, cutoffId: 10 },
      { id: 2, cutoffId: 11 },
      { id: 3, cutoffId: null },
      { id: 4 },
    ], { id: 10 })).toEqual([{ id: 1, cutoffId: 10 }])
  })
})
