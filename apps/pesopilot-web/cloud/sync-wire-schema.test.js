import { readFile } from 'node:fs/promises'
import { it, expect } from 'vitest'
import { pesoPilotSyncSchema } from './sync-wire-schema.mjs'

// Representative sealed-schema validation reproduces the two observed HTTP cases.
const hosted = {
  members: { primaryKey: 'id', generatedGlobalId: true, yProps: [] },
  roles: { primaryKey: '[realmId+name]', generatedGlobalId: false, yProps: [] },
  realms: { primaryKey: 'realmId', generatedGlobalId: true, yProps: [] },
  catalogStock: { primaryKey: 'id', generatedGlobalId: false, yProps: [] },
}
function sealedStatus(schema) {
  return Object.entries(schema).every(
    ([table, spec]) =>
      hosted[table] && JSON.stringify(spec.yProps) === JSON.stringify(hosted[table].yProps),
  )
    ? 200
    : 422
}
it('reproduces the confirmed rejection then accepts the bounded transport projection', () => {
  const declared = Object.fromEntries(
    Object.entries(hosted).map(([table, spec]) => [
      table,
      { primaryKey: spec.primaryKey, generatedGlobalId: spec.generatedGlobalId, markedForSync: true },
    ]),
  )
  const complete = {
    ...declared,
    $jobs: {},
    $syncState: {},
    $baseRevs: { primaryKey: '[tableName+clientRev]' },
    $logins: { primaryKey: 'claims.sub' },
  }
  const before = structuredClone(complete)
  expect(sealedStatus(declared)).toBe(422)
  expect(sealedStatus({ ...hosted, $jobs: { markedForSync: false } })).toBe(422)
  expect(sealedStatus(pesoPilotSyncSchema(complete))).toBe(200)
  expect(complete).toEqual(before)
  expect(Object.keys(pesoPilotSyncSchema(complete))).toEqual(Object.keys(hosted))
})
it('preserves synchronized deletion markers, flags, primary keys and nonempty collaborative fields', () => {
  const schema = {
    old: {
      markedForSync: true,
      deleted: true,
      initiallySynced: false,
      primaryKey: 'id',
      yProps: ['document'],
    },
  }
  expect(pesoPilotSyncSchema(schema)).toEqual(schema)
})
it('patches the pinned development and production artifacts at the request schema only', async () => {
  for (const name of ['dexie-cloud-addon.js', 'dexie-cloud-addon.min.js']) {
    const code = await readFile(
      new URL('../node_modules/dexie-cloud-addon/dist/modern/' + name, import.meta.url),
      'utf8',
    )
    expect(code).toContain('// PesoPilot sealed-schema transport compatibility 4.4.16')
    expect(code).toMatch(/schema:\s*pesoPilotSyncSchema\(/)
  }
})
