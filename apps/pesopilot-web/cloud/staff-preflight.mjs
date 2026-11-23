import { pathToFileURL } from 'node:url'
import { operatorApi } from './bootstrap-dev.mjs'

const businessRealm = 'rlm-pesopilot-business-dev'
const normalized = value => typeof value === 'string' ? value.toLowerCase() : ''

function approvedPermissions(row) {
  const permissions = row.permissions
  if (permissions == null) return row.realmId === businessRealm
  if (typeof permissions !== 'object' || Array.isArray(permissions)) return false
  const keys = Object.keys(permissions)
  if (row.realmId === businessRealm) return keys.length === 0
  return keys.length === 1 && keys[0] === 'add' &&
    Array.isArray(permissions.add) && permissions.add.length === 1 &&
    permissions.add[0] === 'branchTransactions'
}

export async function inspectStaffMemberships(api, email, branch, { byName = false } = {}) {
  email = email?.trim().toLowerCase()
  branch = branch?.trim()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !branch)
    throw new Error('Supply the disposable Staff email and expected development branch ID or name.')

  const [user, realm, branches, members] = await Promise.all([
    api('/users/' + encodeURIComponent(email)),
    api('/all/realms/' + businessRealm),
    api('/all/businessBranches?realmId=' + businessRealm),
    api('/all/members'),
  ])
  if (user?.userId !== email || user.deactivated ||
      (user.data?.email && normalized(user.data.email) !== email) ||
      !realm?.owner || realm.owner === email || !Array.isArray(branches) || !Array.isArray(members))
    throw new Error('Unable to verify the disposable identity and development membership data.')

  const businessBranches = branches.filter(row => row.realmId === businessRealm)
  const selected = businessBranches.filter(row =>
    byName ? normalized(row.name) === normalized(branch) : row.id === branch,
  )
  if (selected.length !== 1 || typeof selected[0].id !== 'string' || !selected[0].id)
    throw new Error('Expected one matching development branch. Check the exact name or use its ID.')
  const [{ id: branchId, name: branchName }] = selected
  const branchIds = new Set(businessBranches.map(row => row.id))
  const matches = members.filter(row => row.userId === email || normalized(row.email) === email)
  const business = matches.filter(row => row.realmId === businessRealm)
  const exactStaff = row => Array.isArray(row.roles) && row.roles.length === 1 && row.roles[0] === 'staff'
  const assignments = matches.filter(row => branchIds.has(row.realmId) && exactStaff(row))
  const targetIds = business.length === 1 && exactStaff(business[0])
    ? [business[0].id, ...assignments.map(row => row.id)]
    : []
  const rows = matches.map(row => ({
    id: row.id, realmId: row.realmId, roles: row.roles ?? [],
    state: row.rejected ? 'rejected' : row.accepted ? 'accepted' : 'pending',
    wouldRemove: targetIds.includes(row.id),
  }))
  const valid = branchIds.has(branchId) && business.length === 1 &&
    business[0].userId === email && normalized(business[0].email) === email &&
    business[0].accepted && !business[0].rejected &&
    assignments.length === 1 && assignments[0].realmId === branchId &&
    assignments[0].userId === email && assignments[0].accepted && !assignments[0].rejected &&
    matches.length === 2 && targetIds.length === 2 &&
    new Set(targetIds).size === 2 && targetIds.every(id => typeof id === 'string' && id) &&
    matches.every(row => exactStaff(row) &&
      (!row.email || normalized(row.email) === email) &&
      approvedPermissions(row))
  return { result: valid ? 'READY_FOR_OWNER_REVIEW' : 'STOP', userId: email,
    expectedBranchId: branchId, expectedBranchName: branchName, matchingCount: rows.length, affectedCount: targetIds.length, rows }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const [email, branch, flag] = process.argv.slice(2)
    if (process.argv.length > 5 || (flag && flag !== '--branch-name'))
      throw new Error('Usage: node staff-preflight.mjs <email> <branch ID or name> [--branch-name]')
    const report = await inspectStaffMemberships(await operatorApi(false), email, branch, {
      byName: flag === '--branch-name',
    })
    console.log(JSON.stringify(report, null, 2))
    if (report.result === 'STOP') process.exitCode = 1
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
