import { db } from './client.ts'
import { schemaMetadata } from '../../../../cloud/schema-diagnostic.mjs'

// Installed only by an explicit development-console action. Observes one existing
// request; it does not trigger synchronization or read business records.
export function captureNextSync() {
  if (!import.meta.env.DEV || location.hostname !== 'localhost' || !db)
    throw new Error('Use the local development app.')
  if (window.__pesoSchemaCapture) throw new Error('A capture is already active.')
  const original = window.fetch
  let claimed = false
  let timer
  function restore() {
    if (window.fetch === wrapped) window.fetch = original
    delete window.__pesoSchemaCapture
    clearTimeout(timer)
  }
  const wrapped = async function (input, init) {
    const address = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    if (claimed || address !== 'https://z5jxogiwe.dexie.cloud/sync')
      return original.call(this, input, init)
    claimed = true
    let metadata
    try {
      // The pinned addon supplies a serialized TSON string in init.body.
      if (typeof init?.body !== 'string') throw new Error('Unexpected request encoding.')
      metadata = schemaMetadata(JSON.parse(init.body).schema)
    } catch {
      restore()
      console.info('Schema capture could not decode the request. No request content was saved.')
      return original.call(this, input, init)
    }
    const persisted = await db
      .table('$syncState')
      .get('schema')
      .catch(() => null)
    const report = {
      databaseUrl: 'https://z5jxogiwe.dexie.cloud',
      addonVersion: db.cloud.version,
      transmitted: metadata,
      declared: schemaMetadata(db.cloud.schema),
      persisted: persisted ? schemaMetadata(persisted) : null,
      localTables: db.tables.map((table) => ({
        name: table.name,
        primaryKey: table.schema.primKey.keyPath,
        autoIncrement: table.schema.primKey.auto,
        secondaryIndexes: table.schema.indexes.map((index) => index.name),
      })),
    }
    try {
      const response = await original.call(this, input, init)
      report.httpStatus = response.status
      save(report)
      return response
    } catch (error) {
      report.httpStatus = null
      save(report)
      throw error
    } finally {
      restore()
    }
  }
  function save(report) {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }),
    )
    const link = document.createElement('a')
    link.href = url
    link.download = 'pesopilot-sync-schema.json'
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    console.info('Saved schema metadata only to pesopilot-sync-schema.json.')
  }
  window.fetch = wrapped
  window.__pesoSchemaCapture = true
  timer = setTimeout(() => {
    restore()
    console.info('Schema capture timed out without a sync request.')
  }, 60000)
  console.info('Schema capture armed. Click Retry access check once within 60 seconds.')
}
