import { businessBackupRepository } from '../repositories/businessBackupRepository.js'
import { BUSINESS_BACKUP_MAX_BYTES, BUSINESS_BACKUP_VERSION, validateBusinessBackup } from './businessBackupValidation.js'

function checkSize(text) {
  if (typeof text !== 'string' || new TextEncoder().encode(text).byteLength > BUSINESS_BACKUP_MAX_BYTES) {
    throw new Error('Business backups must be JSON files of at most 10 MiB.')
  }
}

export const businessBackupService = {
  async exportText() {
    const backup = validateBusinessBackup({
      app: 'PesoPilot Business', version: BUSINESS_BACKUP_VERSION, databaseVersion: 2,
      exportedAt: new Date().toISOString(), stores: await businessBackupRepository.read(),
    })
    const text = JSON.stringify(backup, null, 2)
    checkSize(text)
    return text
  },

  async prepareRestore(text) {
    checkSize(text)
    let input
    try { input = JSON.parse(text) } catch { throw new Error('Invalid Business backup JSON. No records were replaced.') }
    const backup = validateBusinessBackup(input)
    const current = await businessBackupRepository.read()
    return { backup, expectedSnapshot: JSON.stringify(current) }
  },

  async restore(plan, ownerConfirmed) {
    if (ownerConfirmed !== true) throw new Error('Owner confirmation is required to replace Business records.')
    const backup = validateBusinessBackup(plan?.backup)
    if (typeof plan.expectedSnapshot !== 'string') throw new Error('Validate the backup before replacing Business records.')
    await businessBackupRepository.replace(backup.stores, plan.expectedSnapshot)
  },
}
