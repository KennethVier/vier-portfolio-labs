import { readFile, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

const url = 'https://z5jxogiwe.dexie.cloud'
const realm = 'rlm-pesopilot-business-dev'
const memberId = 'mmb-pesopilot-dev-admin'

function importDefinition(owner) {
  return {
    schema: { realms: '@realmId', members: '@id', roles: '[realmId+name]', catalogStock: 'id' },
    sealed: true,
    roles: {
      admin: {
        displayName: 'Admin',
        description: 'Manage the business realm',
        permissions: { manage: '*' },
      },
      staff: {
        displayName: 'Staff',
        description: 'Read shared stock and record local POS sales',
        permissions: {},
      },
    },
    data: {
      [realm]: {
        realms: { [realm]: { realmId: realm, owner, name: 'PesoPilot Business Development' } },
        members: {
          'mmb-pesopilot-dev-admin': {
            id: 'mmb-pesopilot-dev-admin',
            realmId: realm,
            owner,
            userId: owner,
            email: owner,
            roles: ['admin'],
            accepted: true,
            invite: false,
          },
        },
      },
    },
  }
}

export async function provision(owner, api, prepare = false, log = console.log) {
  const userPath = '/users/' + encodeURIComponent(owner)
  const readState = () =>
    Promise.all([api(userPath), api('/all/realms/' + realm), api('/all/members/' + memberId)])
  let [user, business, membership] = await readState()
  function validateUser(row) {
    if (row.userId !== owner || (row.data?.email && row.data.email.toLowerCase() !== owner))
      throw new Error(
        'Application-user identity differs from the verified email. Inspect it in Dexie Cloud Manager.',
      )
    if (
      !['eval', 'prod'].includes(row.type) ||
      row.deactivated ||
      (row.validUntil && Date.parse(row.validUntil) <= Date.now()) ||
      (row.type === 'eval' && row.evalDaysLeft === 0)
    )
      throw new Error(
        'Existing user has an inactive or unsupported license. Review it in Manager; no license was changed.',
      )
  }
  if (business && (business.realmId !== realm || business.owner !== owner))
    throw new Error('Existing realm has a different owner or ID. Stopping before any writes.')
  if (
    membership &&
    (membership.realmId !== realm ||
      membership.id !== memberId ||
      membership.owner !== owner ||
      membership.userId !== owner ||
      membership.email?.toLowerCase() !== owner ||
      membership.roles?.length !== 1 ||
      membership.roles[0] !== 'admin' ||
      !membership.accepted ||
      membership.rejected)
  )
    throw new Error(
      'Existing first-Admin membership conflicts with the verified identity or role. Inspect it before retrying.',
    )
  if (user) validateUser(user)
  log('Application user: ' + (user ? 'already registered (' + user.type + ')' : 'missing'))
  log('Business realm: ' + (business ? 'owner matches' : 'missing'))
  log('First Admin membership: ' + (membership ? 'accepted and matches' : 'missing'))
  if (!prepare) {
    if (!user || !business || !membership) throw new Error('First Admin setup is incomplete.')
    return null
  }
  if (!user) {
    await api('/users', [{ userId: owner, type: 'eval', evalDaysLeft: 30, data: { email: owner } }])
    user = await api(userPath)
    if (!user) throw new Error('Application user was not present on read-back. Re-run the check.')
    validateUser(user)
    log('Created and verified the development evaluation user.')
  }
  if (business && membership) return null
  const manifest = importDefinition(owner)
  if (business) delete manifest.data[realm].realms
  if (membership) delete manifest.data[realm].members
  return manifest
}

export async function operatorApi(write = false) {
  async function readConfig(file) {
    try {
      return JSON.parse(await readFile(file, 'utf8'))
    } catch {
      throw new Error('Cannot read ' + file + ' in the Dexie operator directory.')
    }
  }
  if ((await readConfig('dexie-cloud.json')).dbUrl !== url)
    throw new Error('Expected the existing PesoPilot development database.')
  const key = (await readConfig('dexie-cloud.key'))[url]
  if (!key?.clientId || !key.clientSecret)
    throw new Error('No local CLI credential for the development URL.')
  const scopes = ['ACCESS_DB', 'GLOBAL_READ']
  if (write) scopes.push('GLOBAL_WRITE')
  const response = await fetch(url + '/token', {
    method: 'POST',
    redirect: 'error',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: key.clientId,
      client_secret: key.clientSecret,
      scopes,
    }),
  })
  if (!response.ok)
    throw new Error(
      'Development token request failed (HTTP ' + response.status + '). Check local CLI authorization.',
    )
  const { accessToken } = await response.json().catch(() => {
    throw new Error('Invalid Dexie token response.')
  })
  if (!accessToken) throw new Error('Dexie did not issue a management session.')
  async function api(path, body) {
    const result = await fetch(url + path, {
      method: body ? 'POST' : 'GET',
      redirect: 'error',
      headers: { Authorization: 'Bearer ' + accessToken, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })
    if (!body && result.status === 404) return null
    if (!result.ok)
      throw new Error(
        'Dexie ' +
          (body ? 'write' : 'read') +
          ' failed for ' +
          path.split('/')[1] +
          ' (HTTP ' +
          result.status +
          ').',
      )
    return body
      ? null
      : result.json().catch(() => {
          throw new Error('Invalid Dexie record response.')
        })
  }

  return api
}

async function main() {
  const [mode, email, manifestPath] = process.argv.slice(2)
  const owner = email?.trim().toLowerCase()
  if (
    !['--prepare', '--verify'].includes(mode) ||
    !owner ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(owner) ||
    (mode === '--prepare' && !manifestPath)
  )
    throw new Error('Run the owner setup PowerShell script with the verified email.')
  const api = await operatorApi(mode === '--prepare')
  const manifest = await provision(owner, api, mode === '--prepare')
  if (manifest) await writeFile(manifestPath, JSON.stringify(manifest), { mode: 0o600, flag: 'wx' })
}
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url)
  main().catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
