import { expect, it } from 'vitest'
import { roleNavigation, permitsBusinessPath } from './navigation.js'
it('gives Admin oversight without POS and Staff only branch operations', () => {
  expect(roleNavigation('admin').map((row) => row[1])).not.toContain('POS')
  expect(roleNavigation('admin')[0][1]).toBe('Overview')
  expect(roleNavigation('staff').map((row) => row[1])).toEqual([
    'POS',
    'Branch Inventory',
    'Branch Sales',
    'Daily Audit',
    'Branch Analytics',
  ])
  for (const role of ['admin', 'staff']) {
    const profile = { enabled: true, role }
    expect(permitsBusinessPath(profile, '/business')).toBe(true)
    expect(permitsBusinessPath(profile, '/business/pos')).toBe(false)
    expect(permitsBusinessPath(profile, '/business/pricing')).toBe(role === 'admin')
    expect(permitsBusinessPath(profile, '/business/products')).toBe(
      role === 'admin',
    )
    expect(permitsBusinessPath(profile, '/business/users')).toBe(
      role === 'admin',
    )
  }
  expect(
    permitsBusinessPath({ enabled: false, role: 'admin' }, '/business'),
  ).toBe(false)
})
