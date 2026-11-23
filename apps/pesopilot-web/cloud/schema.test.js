import { it, expect } from 'vitest'
import { schemaPlan, businessSchema } from './schema.mjs'
it('detects missing application tables in a sealed fixture and verifies additive import on retry', () => {
  const fixture = {
    schema: { members: '@id', roles: '[realmId+name]', realms: '@realmId' },
    sealed: true,
  }
  expect(schemaPlan(fixture).missing).toEqual(['catalogStock'])
  const plan = schemaPlan(fixture)
  expect(plan.manifest).toEqual({ schema: businessSchema, sealed: true })
  expect(schemaPlan(plan.manifest).missing).toEqual([])
  expect(plan.manifest).not.toHaveProperty('data')
})
it('refuses changing an existing primary key and retains additional hosted tables', () => {
  expect(() => schemaPlan({ schema: { catalogStock: '@id' }, sealed: true })).toThrow('primary key')
  expect(
    schemaPlan({ schema: { ...businessSchema, extra: 'id' }, sealed: true }).manifest.schema.extra,
  ).toBe('id')
})

it('retains hosted secondary index declarations without treating them as a primary-key mismatch', () => {
  const existing = { ...businessSchema, catalogStock: 'id,realmId' }
  expect(schemaPlan({ schema: existing, sealed: true }).manifest.schema).toEqual(existing)
})
