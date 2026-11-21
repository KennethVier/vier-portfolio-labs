import { pathToFileURL } from 'node:url'
import { operatorApi } from './bootstrap-dev.mjs'

const realmId = 'rlm-pesopilot-business-dev'
const developer = 'kennethcerrado23@gmail.com'
const business = 'pesopilotbusiness@gmail.com'
const developerMember = 'mmb-pesopilot-dev-admin'
const businessMember = 'mmb-pesopilot-business-admin'

export async function transferAdmin(api, mode, log = console.log) {
  if (!['transfer', 'verify', 'rollback'].includes(mode))
    throw new Error('Use transfer, verify or rollback.')
  const target = mode === 'rollback' ? developer : business
  const getRealm = () => api('/all/realms/' + realmId)
  const getMember = (id) => api('/all/members/' + id)
  const getUser = (email) => api('/users/' + encodeURIComponent(email))
  const [realm, oldMember, newMember, oldUser, newUser] = await Promise.all([
    getRealm(),
    getMember(developerMember),
    getMember(businessMember),
    getUser(developer),
    getUser(business),
  ])
  if (!realm || realm.realmId !== realmId || ![developer, business].includes(realm.owner))
    throw new Error('Unexpected realm owner or missing realm. No writes attempted.')
  function activeUser(user, email) {
    if (
      !user ||
      user.userId !== email ||
      (user.data?.email && user.data.email.toLowerCase() !== email) ||
      !['eval', 'prod'].includes(user.type) ||
      user.deactivated ||
      (user.validUntil && Date.parse(user.validUntil) <= Date.now()) ||
      (user.type === 'eval' && user.evalDaysLeft === 0)
    )
      throw new Error('Missing, inactive or conflicting application user: ' + email)
  }
  function admin(member, id, email) {
    if (
      !member ||
      member.id !== id ||
      member.realmId !== realmId ||
      member.userId !== email ||
      member.email?.toLowerCase() !== email ||
      !member.accepted ||
      member.rejected ||
      member.roles?.length !== 1 ||
      member.roles[0] !== 'admin'
    )
      throw new Error('Missing or conflicting accepted Admin membership: ' + email)
  }
  activeUser(oldUser, developer)
  admin(oldMember, developerMember, developer)
  if (newUser) activeUser(newUser, business)
  if (newMember) admin(newMember, businessMember, business)
  log('Current application realm owner: ' + realm.owner)
  log('Developer Admin membership verified and retained.')
  if (mode === 'verify') {
    activeUser(newUser, business)
    admin(newMember, businessMember, business)
    if (realm.owner !== business) throw new Error('Transfer incomplete. Rerun transfer.')
    log(
      'Business Admin and realm ownership verified. Live OTP and authorization still require browser verification.',
    )
    return
  }
  if (mode === 'transfer') {
    if (!newUser) {
      await api('/users', [
        { userId: business, type: 'eval', evalDaysLeft: 30, data: { email: business } },
      ])
      activeUser(await getUser(business), business)
      log('Business application user created and verified.')
    } else log('Business application user already exists; license preserved.')
    if (!newMember) {
      await api('/all/members', [
        {
          id: businessMember,
          realmId,
          owner: business,
          userId: business,
          email: business,
          roles: ['admin'],
          accepted: true,
          invite: false,
        },
      ])
      admin(await getMember(businessMember), businessMember, business)
    }
  }
  // Re-read before replacement because REST POST replaces the complete object.
  const current = await getRealm()
  if (!current || current.owner !== realm.owner)
    throw new Error('Realm changed during transfer. Inspect and retry.')
  admin(await getMember(developerMember), developerMember, developer)
  if (mode === 'transfer') admin(await getMember(businessMember), businessMember, business)
  if (current.owner !== target) {
    await api('/all/realms', [{ ...current, owner: target }])
  }
  const updated = await getRealm()
  if (updated?.owner !== target || updated.realmId !== realmId)
    throw new Error('Owner read-back failed. Rerun the same command.')
  for (const [key, value] of Object.entries(current)) {
    if (key !== 'owner' && JSON.stringify(updated[key]) !== JSON.stringify(value))
      throw new Error('Realm metadata changed. Inspect before continuing.')
  }
  admin(await getMember(developerMember), developerMember, developer)
  if (mode === 'transfer') admin(await getMember(businessMember), businessMember, business)
  log('Verified application realm owner: ' + target)
  log('Database creator and management credentials were not changed.')
}
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const mode = process.argv[2]
  operatorApi(mode !== 'verify')
    .then((api) => transferAdmin(api, mode))
    .catch((error) => {
      console.error(error.message)
      console.error(
        'A completed step may be retained. Rerun the same command after resolving the diagnostic.',
      )
      process.exitCode = 1
    })
}
