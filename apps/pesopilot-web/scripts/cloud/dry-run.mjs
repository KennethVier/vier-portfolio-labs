import { readFile, stat } from 'node:fs/promises'
import { createServer } from 'vite'
import { sandbox } from './sandbox.mjs'

const file = process.argv[2]
if (!file || (await stat(file)).size > 10 * 1024 * 1024)
  throw new Error('Supply a Business backup up to 10 MiB.')
const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' })
const db = await sandbox()
try {
  const { mapBackup, validateImport } = await server.ssrLoadModule('/scripts/cloud/import-plan.mjs')
  const input = JSON.parse(await readFile(file, 'utf8'))
  console.table(await validateImport(db, mapBackup(input)))
  console.log('Photos retained in backup only:', input.stores.productPhotos?.length ?? 0)
} finally {
  await db.close()
  await server.close()
}
