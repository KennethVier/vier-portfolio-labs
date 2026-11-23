import { it, expect } from 'vitest'
import { compareSchemas, schemaMetadata } from './schema-diagnostic.mjs'
const capture = {
  databaseUrl: 'https://z5jxogiwe.dexie.cloud',
  addonVersion: '4.4.16',
  httpStatus: 422,
  transmitted: {
    catalogStock: { primaryKey: 'id', markedForSync: true },
    oldTable: { primaryKey: 'legacy', markedForSync: true },
    $logins: { primaryKey: 'claims.sub' },
  },
  persisted: { oldTable: { primaryKey: 'legacy' } },
  declared: { catalogStock: { primaryKey: 'id' } },
}
it('reports every transmitted declaration including persisted extra tables and local addon entries', () => {
  const report = compareSchemas(capture, { schema: { catalogStock: 'id' }, sealed: true })
  expect(report.rows.map((row) => [row.table, row.status])).toEqual([
    ['catalogStock', 'matches'],
    ['oldTable', 'missing-on-host'],
  ])
  expect(report.localOnly).toMatchObject([{ table: '$logins', status: 'local-only' }])
  expect(report.rows[1]).toMatchObject({ persisted: true, declared: false, synchronized: true })
})
it('preserves compound keys and generated-ID distinctions while ignoring secondary indexes', () => {
  const report = compareSchemas(
    {
      ...capture,
      transmitted: {
        roles: { primaryKey: '[realmId+name]', markedForSync: true },
        stock: { primaryKey: 'id', generatedGlobalId: true, markedForSync: true },
      },
    },
    { schema: { roles: '[realmId+name]', stock: 'id,realmId' }, sealed: true },
  )
  expect(report.rows[0].status).toBe('matches')
  expect(report.rows[1].status).toBe('primary-key-mismatch')
})
it('excludes credentials, row changes and unknown metadata from schema output', () => {
  const result = schemaMetadata({
    stock: { primaryKey: 'id', accessToken: 'secret', changes: [{ customer: 'private' }] },
  })
  expect(result).toEqual({ stock: { primaryKey: 'id' } })
})

it('labels a direct persisted schema snapshot without claiming it was captured from the wire', () => {
  const report = compareSchemas(
    { databaseUrl: capture.databaseUrl, merged: capture.transmitted, persisted: capture.persisted },
    { schema: { catalogStock: 'id' }, sealed: true },
  )
  expect(report.evidence).toBe('persisted-getSchema-equivalent')
  expect(report.rows.find((row) => row.table === 'oldTable').status).toBe('missing-on-host')
})
