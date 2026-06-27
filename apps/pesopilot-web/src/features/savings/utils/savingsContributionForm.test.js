import { describe, expect, it } from 'vitest'

import { resolveContributionSource } from './savingsContributionForm.js'

describe('savings contribution form helpers', () => {
  it('uses the goal name as contribution type when it is an allowed savings source', () => {
    expect(resolveContributionSource({ name: 'Emergency Fund' })).toBe('Emergency Fund')
  })

  it('falls back to General Savings for custom goal names', () => {
    expect(resolveContributionSource({ name: 'TERRA' })).toBe('General Savings')
  })

  it('falls back to General Savings when no goal is provided', () => {
    expect(resolveContributionSource(null)).toBe('General Savings')
  })
})
