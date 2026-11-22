import { pesoPilotSyncSchema } from '../../../../cloud/sync-wire-schema.mjs'
import { schemaMetadata } from '../../../../cloud/schema-diagnostic.mjs'

// Matches the installed addon's getSchema() metadata projection. Does not open
// the database, start synchronization, intercept fetch, or read business records.
export async function readMergedSchema(database) {
  if (!database?.isOpen()) throw new Error('Wait for the existing cloud database to open.')
  const persisted = await database.transaction('r', database.table('$syncState'), () =>
    database.table('$syncState').get('schema'),
  )
  if (!persisted) throw new Error('The addon has not persisted its schema yet.')
  const merged = structuredClone(persisted)
  const localTables = database.tables.map((table) => {
    const key = table.schema.primKey.keyPath
    if (key && merged[table.name])
      merged[table.name].primaryKey = Array.isArray(key) ? '[' + key.join('+') + ']' : key
    return {
      name: table.name,
      primaryKey: key,
      autoIncrement: table.schema.primKey.auto,
      secondaryIndexes: table.schema.indexes.map((index) => index.name),
    }
  })
  return {
    databaseUrl: database.cloud.options?.databaseUrl,
    addonVersion: database.cloud.version,
    syncContext: {
      usingServiceWorker: Boolean(database.cloud.usingServiceWorker),
      tryUseServiceWorker: Boolean(database.cloud.options?.tryUseServiceWorker),
      controlledByServiceWorker:
        typeof navigator !== 'undefined' && Boolean(navigator.serviceWorker?.controller),
    },
    evidence: 'persisted-getSchema-equivalent',
    merged: schemaMetadata(merged),
    wireProjection: schemaMetadata(pesoPilotSyncSchema(merged)),
    declared: schemaMetadata(database.cloud.schema),
    persisted: schemaMetadata(persisted),
    localTables,
  }
}
export async function downloadMergedSchema(database) {
  if (!import.meta.env.DEV || location.hostname !== 'localhost')
    throw new Error('Use the local development app.')
  const report = await readMergedSchema(database)
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }),
  )
  const link = document.createElement('a')
  link.href = url
  link.download = 'pesopilot-sync-schema.json'
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
