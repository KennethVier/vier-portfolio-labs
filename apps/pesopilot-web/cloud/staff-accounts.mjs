import { pathToFileURL } from 'node:url'
import { operatorApi } from './bootstrap-dev.mjs'
const realmId = 'rlm-pesopilot-business-dev'
const business = 'pesopilotbusiness@gmail.com'
const developer = 'kennethcerrado23@gmail.com'
function active(user, email) {
  if (
    !user ||
    user.userId !== email ||
    (user.data?.email && user.data.email.toLowerCase() !== email) ||
    !['eval', 'prod'].includes(user.type) ||
    user.deactivated ||
    (user.validUntil && Date.parse(user.validUntil) <= Date.now()) ||
    (user.type === 'eval' && user.evalDaysLeft === 0)
  )
    throw new Error(
      'Account is missing, inactive or has a conflicting identity. Review it in Manager; no license was changed.',
    )
}
async function members(api) {
  const rows = await api('/all/members?realmId=' + encodeURIComponent(realmId))
  if (!Array.isArray(rows)) throw new Error('Unexpected membership response.')
  return rows
}
export async function provisionStaff(api, email, log = console.log) {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || [business, developer].includes(email))
    throw new Error('Supply an invited Staff email.')
  function check(rows) {
    const matches = rows.filter(
      (m) => m.realmId === realmId && (m.email?.toLowerCase() === email || m.userId === email),
    )
    if (
      matches.length !== 1 ||
      matches[0].roles?.join() !== 'staff' ||
      Object.keys(matches[0].permissions ?? {}).length > 0 ||
      matches[0].rejected ||
      (matches[0].userId && matches[0].userId !== email)
    )
      throw new Error('An unambiguous Staff invitation is required. Check Users before provisioning.')
  }
  check(await members(api))
  const path = '/users/' + encodeURIComponent(email)
  let user = await api(path)
  if (user) {
    active(user, email)
    log('Already registered. Existing ' + user.type + ' license preserved.')
  } else {
    await api('/users', [{ userId: email, type: 'eval', evalDaysLeft: 30, data: { email } }])
    user = await api(path)
    active(user, email)
    log('Registered and verified Staff application user with a development evaluation license.')
  }
  check(await members(api))
  log('Staff membership verified. Complete OTP and accept the invitation in the Staff browser profile.')
}
export async function auditLicenses(api) {
  const counts = { eval: 0, prod: 0, demo: 0, other: 0, deactivated: 0 }
  const accounts = []
  let paging
  const seen = new Set()
  do {
    const page = await api(
      '/users?limit=1000' + (paging ? '&pagingKey=' + encodeURIComponent(paging) : ''),
    )
    if (!Array.isArray(page?.data)) throw new Error('Unexpected user registry response.')
    for (const user of page.data) {
      const type = ['eval', 'prod', 'demo'].includes(user.type) ? user.type : 'other'
      counts[type]++
      if (user.deactivated) counts.deactivated++
      if ([business, developer, 'kennethcerrado18@gmail.com'].includes(user.userId))
        accounts.push({
          email: user.userId,
          type: user.type,
          evalDaysLeft: user.evalDaysLeft ?? null,
          validUntil: user.validUntil ?? null,
          deactivated: Boolean(user.deactivated),
          lastLogin: user.lastLogin ?? null,
        })
    }
    paging = page.hasMore ? page.pagingKey : null
    if (page.hasMore && (!paging || seen.has(paging)))
      throw new Error('Invalid user registry pagination.')
    if (paging) seen.add(paging)
  } while (paging)
  return {
    registeredAccounts: counts,
    productionUserRecords: counts.prod,
    freeProductionSeatAllowance: 3,
    accounts,
    note: 'Membership count is separate from license type. Confirm allocated seats in Dexie Cloud Manager. No license changes performed.',
  }
}
export async function removeDeveloperMembership(api, verified, log = console.log) {
  if (!verified)
    throw new Error('Confirm live business Admin OTP, Users access and a successful cloud write first.')
  const realm = await api('/all/realms/' + realmId)
  if (realm?.owner !== business) throw new Error('Business realm owner must be the business account.')
  active(await api('/users/' + encodeURIComponent(business)), business)
  const rows = await members(api)
  if (
    !rows.some(
      (m) =>
        m.realmId === realmId &&
        m.userId === business &&
        m.accepted &&
        !m.rejected &&
        m.roles?.join() === 'admin',
    )
  )
    throw new Error('Accepted business Admin membership is required.')
  const old = rows.filter((m) => m.userId === developer || m.email?.toLowerCase() === developer)
  if (!old.length) {
    log('Developer realm membership is already absent.')
    return
  }
  if (
    old.length !== 1 ||
    old[0].realmId !== realmId ||
    old[0].id !== 'mmb-pesopilot-dev-admin' ||
    old[0].roles?.join() !== 'admin'
  )
    throw new Error('Unexpected developer memberships. Inspect before removal.')
  await api('/all/members/' + encodeURIComponent(old[0].id), undefined, 'DELETE')
  if ((await members(api)).some((m) => m.userId === developer || m.email?.toLowerCase() === developer))
    throw new Error('Membership removal read-back failed. Inspect and retry.')
  const remaining = await members(api)
  const latestRealm = await api('/all/realms/' + realmId)
  if (
    latestRealm?.owner !== business ||
    !remaining.some(
      (m) =>
        m.realmId === realmId &&
        m.userId === business &&
        m.accepted &&
        !m.rejected &&
        m.roles?.join() === 'admin',
    )
  )
    throw new Error('Business Admin continuity read-back failed. Inspect before continuing.')
  log(
    'Developer realm membership removed. Application user, license, private records and management access were retained.',
  )
}
async function main() {
  const [mode, email] = process.argv.slice(2)
  if (!['provision', 'audit', 'remove-developer'].includes(mode))
    throw new Error('Use the owner-operated Staff setup script.')
  const api = await operatorApi(mode !== 'audit')
  if (mode === 'provision') await provisionStaff(api, email?.trim().toLowerCase())
  if (mode === 'audit') console.log(JSON.stringify(await auditLicenses(api), null, 2))
  if (mode === 'remove-developer')
    await removeDeveloperMembership(api, process.argv.includes('--business-admin-verified'))
}
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url)
  main().catch((error) => {
    console.error(error.message)
    console.error(
      'Completed registration is retained after a later failure. Rerun after checking the diagnostic.',
    )
    process.exitCode = 1
  })
