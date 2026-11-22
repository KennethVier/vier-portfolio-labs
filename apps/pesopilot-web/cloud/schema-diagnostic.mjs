// Only schema metadata is returned. Callers must never serialize a whole sync request.
const fields = [
  'primaryKey',
  'generatedGlobalId',
  'markedForSync',
  'initiallySynced',
  'deleted',
  'idPrefix',
]
export function schemaMetadata(schema) {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema))
    throw new Error('Schema object missing.')
  return Object.fromEntries(
    Object.entries(schema).map(([table, definition]) => {
      const safe = {}
      if (typeof definition === 'string') return [table, { definition }]
      for (const key of fields) {
        const value = definition?.[key]
        if (typeof value === 'boolean' || (typeof value === 'string' && value.length <= 240))
          safe[key] = value
      }
      if (Array.isArray(definition?.yProps))
        safe.yProps = definition.yProps.filter((v) => typeof v === 'string' && v.length <= 120)
      return [table, safe]
    }),
  )
}
function keyOf(definition) {
  if (definition.definition !== undefined) {
    const first = definition.definition.split(',')[0].trim()
    return { primaryKey: first.replace(/^@/, ''), generatedGlobalId: first.startsWith('@') }
  }
  return {
    primaryKey: definition.primaryKey ?? null,
    generatedGlobalId: Boolean(definition.generatedGlobalId),
  }
}
export function compareSchemas(capture, hosted) {
  if (capture.databaseUrl !== 'https://z5jxogiwe.dexie.cloud') throw new Error('Wrong capture database.')
  const source = capture.transmitted ?? capture.merged
  if (!source) throw new Error('Capture has no request or merged persisted schema.')
  const remote = schemaMetadata(hosted.schema)
  const transmitted = schemaMetadata(source)
  const rows = Object.entries(transmitted).map(([table, definition]) => {
    const clientKey = keyOf(definition)
    const serverKey = remote[table] ? keyOf(remote[table]) : null
    const status =
      definition.markedForSync !== true
        ? 'local-only'
        : !serverKey
          ? 'missing-on-host'
          : clientKey.primaryKey === null
            ? 'client-primary-key-unknown'
            : clientKey.primaryKey !== serverKey.primaryKey ||
                clientKey.generatedGlobalId !== serverKey.generatedGlobalId
              ? 'primary-key-mismatch'
              : 'matches'
    return {
      table,
      synchronized: definition.markedForSync ?? false,
      deleted: definition.deleted ?? false,
      client: clientKey,
      hosted: serverKey,
      status,
      persisted: Boolean(capture.persisted?.[table]),
      declared: Boolean(capture.declared?.[table]),
    }
  })
  return {
    databaseUrl: capture.databaseUrl,
    addonVersion: capture.addonVersion,
    evidence: capture.transmitted ? 'serialized-request' : 'persisted-getSchema-equivalent',
    httpStatus: capture.httpStatus,
    sealed: hosted.sealed,
    rows: rows.filter((row) => row.synchronized),
    localOnly: rows.filter((row) => !row.synchronized),
    hostOnly: Object.keys(remote).filter((table) => !(table in transmitted)),
  }
}
