import { catalogPhotos } from './catalogMedia.js'
import {
  authorizedBranches,
  createBranchRepository,
  projectBranch,
  BUSINESS_REALM,
} from './branchRepository.js'

export const WORKSPACE_READ_MESSAGE =
  'Business records could not be loaded. Try again or ask the owner for help.'
const tableNames = [
  'branchCatalog',
  'businessBranches',
  'branchTransactions',
  'members',
  'realms',
  'roles',
]
const safeMessages = new Set([
  'Branch ledger integrity check failed. No stock was replaced.',
  'Unsupported branch ledger record.',
  'Branch sale and movement totals do not reconcile.',
  'Branch stock movement does not reconcile.',
  'Branch stock limit exceeded.',
  'Branch sale is missing.',
  'Admin membership required.',
  'Exactly one authorized branch assignment is required for Staff.',
  'Branch owner is missing. Ask the owner to review this branch.',
])
export class WorkspaceReadError extends Error {
  constructor(stage, cause, branchPosition) {
    super(WORKSPACE_READ_MESSAGE, { cause })
    this.name = 'WorkspaceReadError'
    this.stage = stage
    this.branchPosition = branchPosition
  }
}
export function sanitizeReadFailure(error) {
  const name = /^[A-Za-z]{1,48}Error$/.test(error?.name) ? error.name : 'Error'
  const raw = String(error?.message ?? '')
  let message = 'Unrecognized exception text withheld.'
  if (safeMessages.has(raw)) message = raw
  else if (
    /KeyPath (realmId|id|name|inventoryPoolId|occurredAt) on object store (branchCatalog|businessBranches|branchTransactions|members|realms) is not indexed/.test(
      raw,
    )
  )
    message = raw.match(
      /KeyPath (?:realmId|id|name|inventoryPoolId|occurredAt) on object store (?:branchCatalog|businessBranches|branchTransactions|members|realms) is not indexed/,
    )[0]
  else if (
    /not.*indexed|index.*not|object store.*not|not.*object store/i.test(raw)
  )
    message = 'Schema or index lookup failed.'
  else if (/transaction.*inactive|transaction.*commit/i.test(raw))
    message = 'Database transaction state failed.'
  else if (/Cannot read|is not a function/.test(raw))
    message = 'Unexpected record or database API shape.'
  else if (/permission|unauthorized|forbidden|access.*denied/i.test(raw))
    message = 'Read authorization failed.'
  return {
    name,
    message,
    messageRedacted: message !== raw,
    ...(Number.isSafeInteger(error?.code) ? { code: error.code } : {}),
    ...(/^BRANCH_[A-Z_]{1,48}$/.test(error?.code) ? { code: error.code } : {}),
    referencedTables: tableNames.filter((table) => raw.includes(table)),
  }
}
export function workspaceReadReport(database, error, syncPhase) {
  const original = error instanceof WorkspaceReadError ? error.cause : error
  return {
    version: 1,
    stage: error?.stage ?? 'unknown',
    ...(Number.isSafeInteger(error?.branchPosition)
      ? { branchPosition: error.branchPosition }
      : {}),
    databaseVersion: database.verno,
    databaseOpen: database.isOpen(),
    addonVersion: /^\d+(\.\d+){1,3}$/.test(database.cloud?.version)
      ? database.cloud.version
      : 'unavailable',
    syncPhase: [
      'initial',
      'not-in-sync',
      'pushing',
      'pulling',
      'in-sync',
      'offline',
      'error',
    ].includes(syncPhase)
      ? syncPhase
      : 'unknown',
    error: sanitizeReadFailure(original),
    tables: tableNames.map((name) => {
      const table = database.tables.find((table) => table.name === name)
      const safe = (value) =>
        typeof value === 'string' && /^[A-Za-z0-9_+[\].$-]{1,120}$/.test(value)
          ? value
          : 'withheld'
      return {
        name,
        present: Boolean(table),
        ...(table
          ? {
              key: Array.isArray(table.schema.primKey.keyPath)
                ? table.schema.primKey.keyPath.map(safe)
                : safe(table.schema.primKey.keyPath),
              indexes: table.schema.indexes.map((index) => safe(index.name)),
            }
          : {}),
      }
    }),
  }
}

// The same complete reader drives initial observation and explicit retry. It never writes.
export async function readBranchWorkspace(
  database,
  { userId, role, branchId },
  onStage = () => {},
) {
  async function step(stage, action, branchPosition) {
    onStage(stage)
    try {
      return await action()
    } catch (error) {
      if (error instanceof WorkspaceReadError) throw error
      throw new WorkspaceReadError(stage, error, branchPosition)
    }
  }
  const branches = await step('authorization', () =>
    authorizedBranches(database, userId, step),
  )
  const catalog = await step('catalog', () =>
    database.branchCatalog.where('realmId').equals(BUSINESS_REALM).toArray(),
  )
  const members = await step('members', () => database.members.toArray())
  const registry = await step('registry', () =>
    database.businessBranches.where('realmId').equals(BUSINESS_REALM).toArray(),
  )
  const overviews = await Promise.all(
    branches.map(async (branch, index) => {
      const rows = await step(
        'transactions',
        () =>
          database.branchTransactions
            .where('realmId')
            .equals(branch.id)
            .toArray(),
        index + 1,
      )
      return {
        branch,
        ...(await step(
          'projection',
          () => projectBranch(catalog, rows, branch.id),
          index + 1,
        )),
      }
    }),
  )
  // Complete Staff's selected branch load before reporting success, including first assignment.
  const resolvedBranchId =
    role === 'staff' && branches.length === 1 ? branches[0].id : branchId
  const permitted =
    branches.some((branch) => branch.id === resolvedBranchId) &&
    (role === 'admin' || branches.length === 1)
  const repository = createBranchRepository(database, {
    userId,
    branchId: resolvedBranchId,
  })
  const source = permitted
    ? await step('repository.source', () => repository.source())
    : { products: [], sales: [], events: [], conflicts: [] }
  const sales = permitted
    ? await step('repository.sales', () => repository.listSalesHistory())
    : []
  return {
    ...source,
    sales,
    branches,
    catalog,
    photos: catalogPhotos(catalog),
    members,
    registry,
    overviews,
    resolvedBranchId,
    isLoading: false,
    readStatus: 'ready',
    error: null,
    diagnostics: null,
  }
}
