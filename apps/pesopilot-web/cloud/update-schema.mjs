import { readFile, writeFile } from 'node:fs/promises'
import { schemaPlan } from './schema.mjs'
const [mode, input, output] = process.argv.slice(2)
if (!['prepare', 'verify'].includes(mode) || !input)
  throw new Error('Supply prepare/verify and schema export path.')
const config = JSON.parse(await readFile('dexie-cloud.json', 'utf8'))
if (config.dbUrl !== 'https://z5jxogiwe.dexie.cloud') throw new Error('Wrong development database.')
const exported = JSON.parse(await readFile(input, 'utf8'))
const plan = schemaPlan(exported)
console.log('Missing synchronized tables:', plan.missing.join(', ') || 'none')
console.log('Schema sealed:', exported.sealed)
if (mode === 'verify') {
  if (output) {
    const before = JSON.parse(await readFile(output, 'utf8'))
    for (const [table, definition] of Object.entries(before.schema)) {
      if (exported.schema[table] !== definition) throw new Error('Existing schema changed for ' + table)
    }
  }
  if (plan.missing.length || !exported.sealed) throw new Error('Hosted schema verification failed.')
} else {
  if (!output) throw new Error('Supply output manifest path.')
  await writeFile(output, JSON.stringify(plan.manifest, null, 2), { flag: 'wx', mode: 0o600 })
}
