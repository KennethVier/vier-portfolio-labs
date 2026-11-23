import { businessSchema } from './schema.mjs'
export const operationalSchema = {
  ...businessSchema,
  branchCatalog: 'id',
  businessBranches: 'id',
  branchTransactions: 'id',
}
export function branchSchemaPlan(before) {
  if (!before?.schema || before.sealed !== true)
    throw new Error('Expected a sealed hosted schema export.')
  const missing = []
  for (const [table, key] of Object.entries(operationalSchema)) {
    const existing = before.schema[table]
    if (existing === undefined) missing.push(table)
    else if (
      typeof existing !== 'string' ||
      existing.split(',')[0].trim() !== key
    )
      throw new Error('Incompatible primary key: ' + table)
  }
  // Only the three demonstrated new tables. Preserve every existing declaration.
  return {
    missing,
    manifest: {
      schema: { ...operationalSchema, ...before.schema },
      sealed: true,
    },
  }
}
