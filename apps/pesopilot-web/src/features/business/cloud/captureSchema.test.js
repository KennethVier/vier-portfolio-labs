// @vitest-environment happy-dom
import Dexie from 'dexie'
import { it, expect, vi } from 'vitest'
import { readMergedSchema } from './captureSchema.js'

it('reads the complete persisted schema in a read-only transaction and fills current primary keys', async () => {
  const db = new Dexie('schema-readonly-test')
  db.version(1).stores({ $syncState: '', roles: '[realmId+name]', stock: 'id' })
  db.cloud = {
    options: { databaseUrl: 'https://z5jxogiwe.dexie.cloud' },
    version: '4.4.16',
    schema: { stock: { markedForSync: true } },
  }
  await db.open()
  const original = {
    stock: { markedForSync: true },
    roles: {},
    obsolete: { primaryKey: 'old', initiallySynced: true },
    $logins: { primaryKey: 'claims.sub' },
  }
  await db.table('$syncState').put(original, 'schema')
  const fetcher = vi.spyOn(window, 'fetch')
  try {
    const result = await readMergedSchema(db)
    expect(result.merged.roles.primaryKey).toBe('[realmId+name]')
    expect(result.merged.stock.primaryKey).toBe('id')
    expect(result.merged.obsolete.primaryKey).toBe('old')
    expect(result.merged.$logins.primaryKey).toBe('claims.sub')
    expect(result.evidence).toBe('persisted-getSchema-equivalent')
    expect(await db.table('$syncState').get('schema')).toEqual(original)
    expect(fetcher).not.toHaveBeenCalled()
  } finally {
    fetcher.mockRestore()
    await db.delete()
  }
})
it('does not open a closed cloud database', async () => {
  const db = { isOpen: () => false, open: vi.fn() }
  await expect(readMergedSchema(db)).rejects.toThrow('existing')
  expect(db.open).not.toHaveBeenCalled()
})
