import { readFile, writeFile } from 'node:fs/promises'
const root = new URL('../../node_modules/dexie-cloud-addon/', import.meta.url)
const pkg = JSON.parse(await readFile(new URL('package.json', root), 'utf8'))
if (pkg.version !== '4.4.16')
  throw new Error('Review the Dexie wire compatibility patch for this addon version.')
const marker = '// PesoPilot sealed-schema transport compatibility 4.4.16\n'
const helper = (
  await readFile(new URL('../../cloud/sync-wire-schema.mjs', import.meta.url), 'utf8')
).replace('export function', 'function')
const targets = [
  ['dist/modern/dexie-cloud-addon.js', 'schema: schema || {},', 'schema: pesoPilotSyncSchema(schema),'],
  ['dist/modern/dexie-cloud-addon.min.js', 'schema:s||{}', 'schema:pesoPilotSyncSchema(s)'],
]
for (const [path, original, replacement] of targets) {
  const file = new URL(path, root)
  const content = await readFile(file, 'utf8')
  if (content.startsWith(marker + helper + '\n') && content.includes(replacement)) continue
  if (content.startsWith(marker) || content.split(original).length !== 2)
    throw new Error('Unexpected Dexie distribution. Refusing to patch ' + path)
  await writeFile(file, marker + helper + '\n' + content.replace(original, replacement))
}
console.log('Verified Dexie 4.4.16 sealed-schema transport compatibility.')
