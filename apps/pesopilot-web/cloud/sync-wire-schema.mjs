// Compatibility with the current sealed-schema endpoint and addon 4.4.16.
// Only the transport schema is projected. The caller's persisted map is intact.
export function pesoPilotSyncSchema(schema) {
  return Object.fromEntries(
    Object.entries(schema || {})
      .filter(([, definition]) => definition.markedForSync === true)
      .map(([table, definition]) => [table, { ...definition, yProps: definition.yProps ?? [] }]),
  )
}
