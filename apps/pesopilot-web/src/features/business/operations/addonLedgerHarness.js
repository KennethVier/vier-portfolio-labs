// Test only: execute the pinned addon's actual private transport functions.
// No copied decoder, network, credentials or production database.
import { readFileSync } from 'node:fs'
import Dexie from 'dexie'
const source = readFileSync(
  new URL(
    '../../../../node_modules/dexie-cloud-addon/dist/modern/dexie-cloud-addon.js',
    import.meta.url,
  ),
  'utf8',
)
const names = [
  '__awaiter',
  'encodeIdsForServer',
  'cloneChange',
  'applyServerChanges',
  'markIfHasBlobRefs',
  'hasBlobRefs',
  'isBlobRef',
]
const functions = names.map((name) => {
  const declaration = source.match(
    new RegExp('^function ' + name + '\\([^]*?^}', 'm'),
  )
  if (!declaration) throw new Error('Pinned addon transport changed: ' + name)
  return declaration[0]
})
export const { encodeIdsForServer, applyServerChanges } = new Function(
  'Dexie',
  functions.join('\n') + '\nreturn {encodeIdsForServer, applyServerChanges};',
)(Dexie)
export async function deliverAddonRecords(database, records, type = 'upsert') {
  const changes = encodeIdsForServer(
    database.core.schema,
    { isLoggedIn: true, userId: 'synthetic-staff' },
    [
      {
        table: 'branchTransactions',
        muts: [
          {
            type,
            keys: records.map((row) => row.id),
            values: structuredClone(records),
          },
        ],
      },
    ],
  )
  // Transport framing: JSON round-trip, then the exact addon's receive path.
  await database.transaction('rw', database.branchTransactions, () =>
    applyServerChanges(JSON.parse(JSON.stringify(changes)), {
      dx: database,
      table: (name) => database.table(name),
      cloud: database.cloud,
    }),
  )
}
