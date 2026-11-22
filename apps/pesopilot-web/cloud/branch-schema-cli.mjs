import { readFile, writeFile } from 'node:fs/promises'
import { branchSchemaPlan } from './branch-schema.mjs'
const [mode, input, output] = process.argv.slice(2)
const config = JSON.parse(await readFile('dexie-cloud.json', 'utf8'))
if (config.dbUrl !== 'https://z5jxogiwe.dexie.cloud')
  throw new Error('Wrong database. Development only.')
const exported = JSON.parse(await readFile(input, 'utf8'))
const plan = branchSchemaPlan(exported)
console.log(
  'Missing operational tables: ' + (plan.missing.join(', ') || 'none'),
)
if (mode === 'prepare') {
  await writeFile(output, JSON.stringify(plan.manifest, null, 2), {
    flag: 'wx',
    mode: 0o600,
  })
} else if (mode === 'verify') {
  if (plan.missing.length)
    throw new Error('Hosted operational schema is incomplete.')
  const before = JSON.parse(await readFile(output, 'utf8'))
  for (const [table, definition] of Object.entries(before.schema))
    if (exported.schema[table] !== definition)
      throw new Error('Existing schema changed: ' + table)
  console.log(
    'Sealed operational schema verified. Existing declarations preserved.',
  )
} else throw new Error('Expected prepare or verify.')
