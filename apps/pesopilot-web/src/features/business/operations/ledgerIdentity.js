// Cloud 4.4.16 decodes keys starting '[' and ending ']' as compound arrays.
// New scalar IDs therefore use a prefix. Existing keys are never rewritten.
const PREFIX = 'evt:'
const validPart = (value) =>
  typeof value === 'string' && value.length > 0 && value.length <= 400
const tupleValid = (value) =>
  Array.isArray(value) && value.length === 3 && value.every(validPart)
export function ledgerIntegrity(condition, code) {
  if (!condition)
    throw Object.assign(
      new Error('Branch ledger integrity check failed. No stock was replaced.'),
      { code },
    )
}
export function eventKeys(branch, actor, key) {
  const tuple = [branch, actor, key]
  if (!tupleValid(tuple))
    throw new Error('A stable branch, actor and request key are required.')
  const legacy = JSON.stringify(tuple)
  return [PREFIX + legacy, legacy, tuple]
}
export function eventId(branch, actor, key) {
  return eventKeys(branch, actor, key)[0]
}
function identity(entry) {
  ledgerIntegrity(entry && typeof entry === 'object', 'BRANCH_RECORD_SHAPE')
  let tuple,
    prefixed = false
  const { id } = entry
  if (Array.isArray(id)) tuple = id
  else {
    ledgerIntegrity(typeof id === 'string' && Boolean(id), 'BRANCH_EVENT_ID')
    prefixed = id.startsWith(PREFIX)
    if (prefixed || id.startsWith('[')) {
      try {
        tuple = JSON.parse(prefixed ? id.slice(PREFIX.length) : id)
      } catch {
        ledgerIntegrity(false, 'BRANCH_EVENT_ID')
      }
    } else return { entry, logical: id, wire: id }
  }
  ledgerIntegrity(tupleValid(tuple), 'BRANCH_EVENT_ID')
  ledgerIntegrity(
    tuple[0] === entry.branchId &&
      tuple[1] ===
        (entry.kind === 'legacyImport'
          ? 'legacy:pesopilot-business'
          : entry.actorId),
    'BRANCH_EVENT_ID_SCOPE',
  )
  const legacy = JSON.stringify(tuple)
  // Preserve legacy nested sale/movement references and backup data verbatim.
  return {
    entry: Array.isArray(id) ? { ...entry, id: legacy } : entry,
    logical: PREFIX + legacy,
    wire: prefixed ? PREFIX + legacy : legacy,
  }
}
// Pure read adapter. Only an identical string/array representation of the same
// legacy server key may coalesce. Divergent or distinct server records fail closed.
export function normalizeLedgerEvents(events) {
  const seen = new Map(),
    result = []
  for (const raw of events) {
    const current = identity(raw)
    const previous = seen.get(current.logical)
    if (previous) {
      ledgerIntegrity(
        previous.aliasCount === 1 &&
          previous.wire === current.wire &&
          Array.isArray(previous.raw.id) !== Array.isArray(raw.id) &&
          JSON.stringify(previous.entry) === JSON.stringify(current.entry),
        'BRANCH_EVENT_DUPLICATE',
      )
      previous.aliasCount++
      continue
    }
    seen.set(current.logical, { ...current, raw, aliasCount: 1 })
    result.push(current.entry)
  }
  return result
}
export async function previousEvent(table, branch, actor, key) {
  const records = (await table.bulkGet(eventKeys(branch, actor, key))).filter(
    Boolean,
  )
  ledgerIntegrity(
    records.every((row) => row.realmId === branch && row.branchId === branch),
    'BRANCH_SCOPE_MISMATCH',
  )
  const normalized = normalizeLedgerEvents(records)
  ledgerIntegrity(normalized.length <= 1, 'BRANCH_EVENT_DUPLICATE')
  return normalized[0]
}
