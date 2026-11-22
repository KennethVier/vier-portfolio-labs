import Dexie from 'dexie'
import { authorizedBranches } from './branchRepository.js'
import { normalizeLedgerEvents } from './ledgerIdentity.js'
const shape = (value) =>
  value === null
    ? 'null'
    : Array.isArray(value)
      ? 'array'
      : typeof value === 'string'
        ? value.length
          ? 'string'
          : 'empty-string'
        : typeof value
// Read-only. Counts only, with no identifiers, record values, payloads or credentials.
export async function inspectBranchLedgerIds(database, userId) {
  return database.transaction(
    'r',
    database.businessBranches,
    database.realms,
    database.members,
    database.branchTransactions,
    async () => {
      const branches = await authorizedBranches(database, userId)
      const table = database.branchTransactions
      const result = {
        version: 1,
        keyPath: table.schema.primKey.keyPath === 'id' ? 'id' : 'unexpected',
        branches: [],
      }
      for (let index = 0; index < branches.length; index++) {
        const groups = new Map()
        await table
          .where('realmId')
          .equals(branches[index].id)
          .each((entry, cursor) => {
            let accepted = true
            try {
              normalizeLedgerEvents([entry])
            } catch {
              accepted = false
            }
            let keyMatchesId = false
            try {
              keyMatchesId = Dexie.cmp(cursor.primaryKey, entry.id) === 0
            } catch {
              /* invalid key */
            }
            const metadata = {
              idType: shape(entry.id),
              primaryKeyType: shape(cursor.primaryKey),
              hasOwnId: Object.prototype.hasOwnProperty.call(entry, 'id'),
              keyMatchesId,
              legacyTuple:
                Array.isArray(entry.id) &&
                entry.id.length === 3 &&
                entry.id.every((part) => typeof part === 'string'),
              compatibleIdentity: accepted,
            }
            const signature = JSON.stringify(metadata)
            const group = groups.get(signature) ?? { ...metadata, count: 0 }
            group.count++
            groups.set(signature, group)
          })
        result.branches.push({
          branchPosition: index + 1,
          groups: [...groups.values()],
        })
      }
      return result
    },
  )
}
