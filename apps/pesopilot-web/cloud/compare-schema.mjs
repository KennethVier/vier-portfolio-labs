import { readFile } from 'node:fs/promises'
import { compareSchemas } from './schema-diagnostic.mjs'
const [capturePath, hostedPath, beforePath, afterPath] = process.argv.slice(2)
if (!capturePath || !hostedPath)
  throw new Error('Supply browser schema capture and hosted schema export paths.')
const read = async (path) => JSON.parse(await readFile(path, 'utf8'))
const capture = await read(capturePath)
const report = compareSchemas(capture, await read(hostedPath))
if (beforePath || afterPath) {
  if (!beforePath || !afterPath) throw new Error('Supply both previous repair export paths.')
  report.previousRepair = {
    before: compareSchemas(capture, await read(beforePath)),
    after: compareSchemas(capture, await read(afterPath)),
  }
}
console.log(JSON.stringify(report, null, 2))
