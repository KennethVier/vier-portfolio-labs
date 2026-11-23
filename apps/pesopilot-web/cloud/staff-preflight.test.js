import { expect, it } from 'vitest'
import { inspectStaffMemberships } from './staff-preflight.mjs'

const email = 'disposable@example.test'
const realmId = 'rlm-pesopilot-business-dev'
const branch = { id: 'rlm-kenneth', branchId: 'rlm-kenneth', realmId, name: "Kenneth's development branch" }
const other = { id: 'rlm-other', branchId: 'rlm-other', realmId, name: 'Other branch' }
const businessMember = { id: 'mmb-business', realmId, email, userId: email, roles: ['staff'], invite: true, accepted: '2026-11-23T00:00:00Z' }
const branchMember = { ...businessMember, id: 'mmb-branch', realmId: branch.id, permissions: { add: ['branchTransactions'] } }

function fixture(members = [businessMember, branchMember], branches = [branch, other]) {
  const responses = {
    ['/users/' + encodeURIComponent(email)]: { userId: email, data: { email }, type: 'eval' },
    ['/all/realms/' + realmId]: { realmId, owner: 'admin@example.test' },
    ['/all/businessBranches?realmId=' + realmId]: branches,
    '/all/members': members,
  }
  return async path => {
    expect(responses).toHaveProperty([path])
    return structuredClone(responses[path])
  }
}

it('resolves the exact development branch name and accepts the app-shaped Staff pair', async () => {
  const report = await inspectStaffMemberships(fixture(), email, branch.name.toUpperCase(), { byName: true })
  expect(report).toMatchObject({ result: 'READY_FOR_OWNER_REVIEW', expectedBranchId: branch.id,
    expectedBranchName: branch.name, matchingCount: 2, affectedCount: 2 })
})

it.each([
  undefined,
  {},
  { add: ['branchTransactions', 'members'] },
  { add: ['branchTransactions', 'branchTransactions'] },
  { add: ['branchTransactions'], update: ['branchTransactions'] },
  { add: 'branchTransactions' },
])('stops on unapproved branch permissions %j', async permissions => {
  const report = await inspectStaffMemberships(fixture([businessMember, { ...branchMember, permissions }]), email, branch.id)
  expect(report.result).toBe('STOP')
})

it('stops when the business membership has a direct grant', async () => {
  const report = await inspectStaffMemberships(fixture([{ ...businessMember, permissions: branchMember.permissions }, branchMember]), email, branch.id)
  expect(report.result).toBe('STOP')
})

it('reports an extra pending assignment matched by email', async () => {
  const pending = { id: 'mmb-pending', realmId: other.id, email: email.toUpperCase(),
    roles: ['staff'], invite: true, permissions: branchMember.permissions }
  const report = await inspectStaffMemberships(fixture([businessMember, branchMember, pending]), email, branch.id)
  expect(report).toMatchObject({ result: 'STOP', matchingCount: 3, affectedCount: 3 })
  expect(report.rows).toContainEqual({ id: pending.id, realmId: other.id, state: 'pending',
    roles: ['staff'], wouldRemove: true })
})

it('stops on an unexpected matching Admin membership', async () => {
  const admin = { ...businessMember, id: 'mmb-admin', realmId: other.id, roles: ['admin'] }
  const report = await inspectStaffMemberships(fixture([businessMember, branchMember, admin]), email, branch.id)
  expect(report).toMatchObject({ result: 'STOP', matchingCount: 3, affectedCount: 2 })
})

it.each([[], [branch, { ...branch, id: 'rlm-duplicate' }]])('rejects a missing or ambiguous branch name', async (...args) => {
  const branches = args.length === 0 ? [] : args
  await expect(inspectStaffMemberships(fixture(undefined, branches), email, branch.name, { byName: true }))
    .rejects.toThrow('Expected one matching development branch')
})
