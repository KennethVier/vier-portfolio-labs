import {
  BUSINESS_REALM,
  authorizedBranches,
  businessAdmin,
} from './branchRepository.js'
export async function exportBranchBackup(database, uid) {
  return database.transaction(
    'r',
    database.branchCatalog,
    database.businessBranches,
    database.branchTransactions,
    database.realms,
    database.members,
    async () => {
      if (!(await businessAdmin(database, uid)))
        throw new Error('Admin membership required.')
      const branches = await authorizedBranches(database, uid)
      const transactions = (
        await Promise.all(
          branches.map((branch) =>
            database.branchTransactions
              .where('realmId')
              .equals(branch.id)
              .toArray(),
          ),
        )
      ).flat()
      return JSON.stringify(
        {
          app: 'PesoPilot Branch Operations',
          version: 1,
          exportedAt: new Date().toISOString(),
          branches,
          catalog: await database.branchCatalog
            .where('realmId')
            .equals(BUSINESS_REALM)
            .toArray(),
          transactions,
        },
        null,
        2,
      )
    },
  )
}
export function downloadBranchBackup(text) {
  const url = URL.createObjectURL(
    new Blob([text], { type: 'application/json' }),
  )
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download =
    'pesopilot-branch-operations-' +
    new Date().toISOString().slice(0, 10) +
    '.json'
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
