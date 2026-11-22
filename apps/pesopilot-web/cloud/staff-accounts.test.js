import { it, expect, vi } from 'vitest'
import { provisionStaff, auditLicenses, removeDeveloperMembership } from './staff-accounts.mjs'
const email = 'kennethcerrado18@gmail.com'
const realmId = 'rlm-pesopilot-business-dev'
function fixture() {
  const users = new Map()
  const rows = [{ id: 'staff-one', realmId, email, roles: ['staff'], invite: true }]
  const api = vi.fn(async (path, body, method) => {
    if (path.startsWith('/all/members?')) return structuredClone(rows)
    if (path === '/users' && body) {
      users.set(body[0].userId, structuredClone(body[0]))
      return
    }
    if (path.startsWith('/users/'))
      return structuredClone(users.get(decodeURIComponent(path.slice(7))) ?? null)
    if (method === 'DELETE') {
      rows.splice(
        rows.findIndex((m) => m.id === decodeURIComponent(path.split('/').at(-1))),
        1,
      )
      return
    }
    if (path === '/all/realms/' + realmId) return { realmId, owner: 'pesopilotbusiness@gmail.com' }
    throw Error('Unexpected path')
  })
  return { users, rows, api }
}
it('registers an existing Staff invitation exactly once and preserves its membership and license on retry', async () => {
  const { api, users, rows } = fixture()
  await provisionStaff(api, email, vi.fn())
  expect(users.get(email)).toMatchObject({ type: 'eval', evalDaysLeft: 30 })
  users.get(email).type = 'prod'
  await provisionStaff(api, email, vi.fn())
  expect(api.mock.calls.filter(([p, b]) => p === '/users' && b)).toHaveLength(1)
  expect(rows[0]).toMatchObject({ roles: ['staff'], invite: true })
})
it('does not register an uninvited or Admin identity or reactivate an exhausted evaluation', async () => {
  const { api, users, rows } = fixture()
  await expect(provisionStaff(api, 'other@example.test', vi.fn())).rejects.toThrow('invitation')
  rows[0].roles = ['admin']
  await expect(provisionStaff(api, email, vi.fn())).rejects.toThrow('invitation')
  rows[0].roles = ['staff']
  rows[0].permissions = { manage: '*' }
  await expect(provisionStaff(api, email, vi.fn())).rejects.toThrow('invitation')
  delete rows[0].permissions
  users.set(email, { userId: email, type: 'eval', evalDaysLeft: 0 })
  await expect(provisionStaff(api, email, vi.fn())).rejects.toThrow('inactive')
  expect(api.mock.calls.some(([, body]) => body)).toBe(false)
})
it('resumes registration after membership read-back failure without recreating the user', async () => {
  const { api, users } = fixture()
  let reads = 0
  const failing = async (p, b) => {
    if (p.startsWith('/all/members?') && ++reads === 2) throw Error('network')
    return api(p, b)
  }
  await expect(provisionStaff(failing, email, vi.fn())).rejects.toThrow('network')
  expect(users.has(email)).toBe(true)
  await provisionStaff(api, email, vi.fn())
  expect(api.mock.calls.filter(([p, b]) => p === '/users' && b)).toHaveLength(1)
})
it('audits production users across pages without modifying licenses', async () => {
  const api = vi
    .fn()
    .mockResolvedValueOnce({
      data: [{ userId: email, type: 'eval', evalDaysLeft: 23 }],
      hasMore: true,
      pagingKey: 'next',
    })
    .mockResolvedValueOnce({
      data: [{ userId: 'pesopilotbusiness@gmail.com', type: 'prod' }],
      hasMore: false,
    })
  expect(await auditLicenses(api)).toMatchObject({
    productionUserRecords: 1,
    registeredAccounts: { eval: 1, prod: 1 },
  })
  expect(api.mock.calls[1][0]).toContain('pagingKey=next')
  expect(api.mock.calls.every((call) => call.length === 1)).toBe(true)
})
it('removes only the developer realm membership after an explicit live-verification acknowledgement', async () => {
  const { api, users, rows } = fixture()
  const business = 'pesopilotbusiness@gmail.com',
    developer = 'kennethcerrado23@gmail.com'
  users.set(business, { userId: business, type: 'eval', evalDaysLeft: 25 })
  rows.push(
    { id: 'business', realmId, userId: business, roles: ['admin'], accepted: true },
    {
      id: 'mmb-pesopilot-dev-admin',
      realmId,
      userId: developer,
      email: developer,
      roles: ['admin'],
      accepted: true,
    },
  )
  await expect(removeDeveloperMembership(api, false, vi.fn())).rejects.toThrow('Confirm live')
  await removeDeveloperMembership(api, true, vi.fn())
  expect(rows.some((m) => m.userId === developer)).toBe(false)
  expect(rows.some((m) => m.userId === business)).toBe(true)
  expect(api.mock.calls.filter(([, , method]) => method === 'DELETE').map(([path]) => path)).toEqual([
    '/all/members/mmb-pesopilot-dev-admin',
  ])
  await removeDeveloperMembership(api, true, vi.fn())
})
