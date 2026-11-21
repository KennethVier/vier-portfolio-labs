export const businessSchema = {
  members: '@id',
  roles: '[realmId+name]',
  realms: '@realmId',
  catalogStock: 'id',
}
export function schemaPlan(exported) {
  if (!exported?.schema || typeof exported.sealed !== 'boolean')
    throw new Error('Invalid schema export.')
  for (const [table, definition] of Object.entries(exported.schema)) {
    if (typeof definition !== 'string') throw new Error('Invalid hosted definition for ' + table)
  }
  const missing = []
  for (const [table, definition] of Object.entries(businessSchema)) {
    const existing = exported.schema[table]
    if (existing == null) {
      missing.push(table)
      continue
    }
    if (typeof existing !== 'string' || existing.split(',')[0].trim() !== definition)
      throw new Error('Incompatible primary key for ' + table + '. Inspect before importing.')
  }
  return { missing, manifest: { schema: { ...businessSchema, ...exported.schema }, sealed: true } }
}
