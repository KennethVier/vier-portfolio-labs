import { useSettingsStore } from '@/app/settingsStore.js'
import { db } from '@/lib/db/dexie.js'
import {
  APPROVED_STORE_NAMES,
  DEFAULT_SETTINGS_ID,
  STORE_NAMES,
} from '@/lib/db/schema.js'
import {
  defaultCategories,
  defaultMerchantRules,
  defaultSettings,
} from '@/lib/db/seed.js'
import { settingsRepository } from '@/lib/db/repositories/index.js'

export const SETTINGS_OPTIONS = {
  currencies: [
    { label: 'PHP', value: 'PHP' },
    { label: 'USD', value: 'USD' },
  ],
  languages: [{ label: 'English', value: 'en' }],
  lifestyleModes: [
    { label: 'Philippines', value: 'PH' },
    { label: 'International', value: 'INTL' },
  ],
  themes: [
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
    { label: 'System', value: 'system' },
  ],
  densities: [
    { label: 'Compact', value: 'compact' },
    { label: 'Comfortable', value: 'comfortable' },
  ],
}

export const SETTINGS_BACKUP_VERSION = 1

const defaultMvpSettings = {
  ...defaultSettings,
  language: 'en',
  lifestyleMode: 'PH',
  density: 'compact',
}

const validValues = {
  currency: SETTINGS_OPTIONS.currencies.map((option) => option.value),
  language: SETTINGS_OPTIONS.languages.map((option) => option.value),
  lifestyleMode: SETTINGS_OPTIONS.lifestyleModes.map((option) => option.value),
  theme: SETTINGS_OPTIONS.themes.map((option) => option.value),
  density: SETTINGS_OPTIONS.densities.map((option) => option.value),
}

function nowIso() {
  return new Date().toISOString()
}

function pickValid(field, value) {
  return validValues[field].includes(value) ? value : defaultMvpSettings[field]
}

export function getSyncWarningMessage(value, fallback) {
  try {
    const message =
      typeof value === 'string' || typeof value === 'number'
        ? String(value)
        : value?.message
    return typeof message === 'string' && message.trim() ? message : fallback
  } catch {
    return fallback
  }
}

export function normalizeSettings(settings = {}) {
  const normalized = {
    ...defaultMvpSettings,
    ...settings,
    id: DEFAULT_SETTINGS_ID,
  }

  return {
    ...normalized,
    currency: pickValid('currency', normalized.currency),
    language: pickValid('language', normalized.language),
    lifestyleMode: pickValid('lifestyleMode', normalized.lifestyleMode),
    theme: pickValid('theme', normalized.theme),
    density: pickValid('density', normalized.density),
    locale: normalized.locale ?? 'en-PH',
    aiMode: normalized.aiMode ?? 'rules_only',
    salaryMode: normalized.salaryMode ?? 'semi_monthly',
    cloudAiConsent: Boolean(normalized.cloudAiConsent),
  }
}

async function ensureSettings() {
  const existingSettings = await settingsRepository.getSettings()
  const timestamp = nowIso()
  const settings = normalizeSettings({
    ...existingSettings,
    createdAt: existingSettings?.createdAt ?? timestamp,
    updatedAt: existingSettings?.updatedAt ?? timestamp,
  })

  if (!existingSettings) {
    await settingsRepository.upsertSettings(settings)
  }

  return settings
}

export async function loadSettings() {
  const settings = await ensureSettings()
  useSettingsStore.getState().setSettings(settings)
  return settings
}

export async function updateSettings(changes) {
  const existingSettings = await ensureSettings()
  const settings = normalizeSettings({
    ...existingSettings,
    ...changes,
    createdAt: existingSettings.createdAt ?? nowIso(),
    updatedAt: nowIso(),
  })

  await settingsRepository.upsertSettings(settings)
  useSettingsStore.getState().setSettings(settings)
  return settings
}

export function applyThemePreference(theme, target = globalThis.document) {
  if (!target?.documentElement) {
    return
  }

  const root = target.documentElement
  const systemThemeQuery =
    theme === 'system'
      ? globalThis.matchMedia?.('(prefers-color-scheme: dark)')
      : null
  const systemPrefersDark =
    theme === 'system' && Boolean(systemThemeQuery?.matches)

  root.classList.toggle('dark', theme === 'dark' || Boolean(systemPrefersDark))
}

export function applyDensityPreference(density, target = globalThis.document) {
  if (!target?.documentElement) {
    return
  }

  target.documentElement.dataset.density = density
}

export async function buildBackupData() {
  const stores = {}

  await db.open()

  await Promise.all(
    APPROVED_STORE_NAMES.map(async (storeName) => {
      stores[storeName] = await db.table(storeName).toArray()
    }),
  )

  return {
    app: 'PesoPilot',
    version: SETTINGS_BACKUP_VERSION,
    exportedAt: nowIso(),
    stores,
  }
}

export function createBackupFileName(date = new Date()) {
  return `pesopilot-backup-${date.toISOString().slice(0, 10)}.json`
}

export const IMPORT_MODES = {
  FULL: 'full',
  SELECTIVE: 'selective',
}

function withSystemMetadata(record, timestamp, existingRecord = null) {
  return {
    ...record,
    isSystem: true,
    createdAt: existingRecord?.createdAt ?? timestamp,
    updatedAt: timestamp,
  }
}

function normalizeDefaultMerchantRule(rule, timestamp, existingRule = null) {
  return {
    ...rule,
    paymentMethod: null,
    confidence: 1,
    createdBy: 'system',
    createdAt: existingRule?.createdAt ?? timestamp,
    updatedAt: timestamp,
  }
}

function resolveImportMode(options = {}) {
  if (options.mode !== undefined) {
    if (
      options.mode === IMPORT_MODES.FULL ||
      options.mode === IMPORT_MODES.SELECTIVE ||
      options.mode === 'partial'
    ) {
      return options.mode === 'partial' ? IMPORT_MODES.SELECTIVE : options.mode
    }
    throw new Error(
      `Invalid backup options. Unsupported import mode: "${options.mode}". Supported modes are "full" and "selective".`,
    )
  }

  // Default mode is full replacement for all callers when mode is omitted
  return IMPORT_MODES.FULL
}

export function validateBackupData(backupData, options = {}) {
  const mode = resolveImportMode(options)

  if (!backupData || typeof backupData !== 'object' || Array.isArray(backupData)) {
    throw new Error('Invalid backup file. Expected a PesoPilot JSON object.')
  }

  if (
    !backupData.stores ||
    typeof backupData.stores !== 'object' ||
    Array.isArray(backupData.stores)
  ) {
    throw new Error('Invalid backup file. Missing stores object.')
  }

  const recognizedStores = Object.keys(backupData.stores).filter((storeName) =>
    APPROVED_STORE_NAMES.includes(storeName),
  )

  for (const [storeName, records] of Object.entries(backupData.stores)) {
    if (!APPROVED_STORE_NAMES.includes(storeName)) {
      continue
    }

    if (!Array.isArray(records)) {
      throw new Error(`Invalid backup file. Store "${storeName}" must be an array.`)
    }

    for (let i = 0; i < records.length; i++) {
      const record = records[i]
      if (!record || typeof record !== 'object' || Array.isArray(record)) {
        throw new Error(
          `Invalid backup file. Record at index ${i} in store "${storeName}" must be a valid object.`,
        )
      }
    }
  }

  if (backupData.app !== 'PesoPilot') {
    throw new Error('Invalid backup file. Application must be "PesoPilot".')
  }

  if (
    typeof backupData.version !== 'number' ||
    backupData.version !== SETTINGS_BACKUP_VERSION
  ) {
    throw new Error(
      `Invalid backup file. Unsupported backup version: ${backupData.version}.`,
    )
  }

  if (recognizedStores.length === 0) {
    throw new Error('Invalid backup file. No recognized PesoPilot stores found.')
  }

  if (mode === IMPORT_MODES.FULL) {
    const missingStores = APPROVED_STORE_NAMES.filter(
      (storeName) => !Array.isArray(backupData.stores[storeName]),
    )
    if (missingStores.length > 0) {
      throw new Error(
        `Invalid backup file. Missing required stores for full replacement: ${missingStores.join(', ')}.`,
      )
    }
  } else if (mode === IMPORT_MODES.SELECTIVE) {
    const rawSelected = options.selectedStores || options.stores
    if (rawSelected !== undefined) {
      if (!Array.isArray(rawSelected) || rawSelected.length === 0) {
        throw new Error(
          'Invalid backup file. No recognized stores selected for selective import.',
        )
      }
      for (const storeName of rawSelected) {
        if (!APPROVED_STORE_NAMES.includes(storeName)) {
          throw new Error(
            `Invalid backup options. Selected store "${storeName}" is not a recognized PesoPilot store.`,
          )
        }
      }
    }

    const selectedStores = (rawSelected || recognizedStores).filter((storeName) =>
      APPROVED_STORE_NAMES.includes(storeName),
    )

    if (selectedStores.length === 0) {
      throw new Error(
        'Invalid backup file. No recognized stores selected for selective import.',
      )
    }

    for (const storeName of selectedStores) {
      if (!Object.prototype.hasOwnProperty.call(backupData.stores, storeName)) {
        throw new Error(
          `Invalid backup file. Selected store "${storeName}" is missing from backup.`,
        )
      }
      if (!Array.isArray(backupData.stores[storeName])) {
        throw new Error(
          `Invalid backup file. Store "${storeName}" must be an array.`,
        )
      }
    }
  }

  return true
}

async function ensureDefaultsWithinTransaction(
  selectedStoreNames = APPROVED_STORE_NAMES,
  timestamp = nowIso(),
) {
  // Only touch categories if categories was selected for import
  if (selectedStoreNames.includes(STORE_NAMES.categories)) {
    const existingCategories = await db.categories.toArray()
    const existingIds = new Set(existingCategories.map((c) => c.id))
    const missing = defaultCategories.filter((c) => !existingIds.has(c.id))
    if (missing.length > 0) {
      await db.categories.bulkPut(
        missing.map((c) => withSystemMetadata(c, timestamp)),
      )
    }
  }

  // Only touch merchant_rules if merchant_rules was selected for import
  if (selectedStoreNames.includes(STORE_NAMES.merchantRules)) {
    const existingRules = await db.merchant_rules.toArray()
    const existingKeywords = new Set(
      existingRules.map((r) => r.keyword?.toLowerCase().trim()),
    )
    const missingRules = defaultMerchantRules.filter(
      (r) => !existingKeywords.has(r.keyword?.toLowerCase().trim()),
    )
    if (missingRules.length > 0) {
      await db.merchant_rules.bulkAdd(
        missingRules.map((r) => normalizeDefaultMerchantRule(r, timestamp)),
      )
    }
  }

  // Only touch settings if settings was selected for import
  if (selectedStoreNames.includes(STORE_NAMES.settings)) {
    const existingSettings = await db.settings.get(DEFAULT_SETTINGS_ID)
    const settings = normalizeSettings({
      ...existingSettings,
      createdAt: existingSettings?.createdAt ?? timestamp,
      updatedAt: existingSettings?.updatedAt ?? timestamp,
    })
    await db.settings.put(settings)
    return settings
  }

  return null
}

async function reseedMissingDefaults() {
  await db.transaction('rw', db.categories, db.merchant_rules, db.settings, async () => {
    await ensureDefaultsWithinTransaction(APPROVED_STORE_NAMES)
  })
}

export async function importBackupData(backupData, options = {}) {
  validateBackupData(backupData, options)
  const mode = resolveImportMode(options)

  const rawSelected = options.selectedStores || options.stores
  const targetStoreNames =
    mode === IMPORT_MODES.FULL
      ? APPROVED_STORE_NAMES
      : (rawSelected || Object.keys(backupData.stores)).filter((storeName) =>
          APPROVED_STORE_NAMES.includes(storeName),
        )

  const targetTables = targetStoreNames.map((name) => db.table(name))

  let committedSettings = null

  await db.transaction('rw', targetTables, async () => {
    // 1. Clear target tables only
    await Promise.all(targetTables.map((table) => table.clear()))

    // 2. Put backup records for target tables
    for (const storeName of targetStoreNames) {
      const records = backupData.stores[storeName]
      if (Array.isArray(records) && records.length > 0) {
        await db.table(storeName).bulkPut(records)
      }
    }

    // 3. Atomically ensure defaults within permitted import scope
    committedSettings = await ensureDefaultsWithinTransaction(targetStoreNames)
  })

  // The transaction is authoritative; all remaining work is best-effort sync.
  let syncWarning = null
  try {
    if (!committedSettings) {
      const currentSettings = await db.settings.get(DEFAULT_SETTINGS_ID)
      committedSettings = currentSettings ? normalizeSettings(currentSettings) : null
      if (!committedSettings) {
        syncWarning = 'Persisted settings are unavailable for synchronization.'
      }
    }

    if (committedSettings) {
      useSettingsStore.getState().setSettings(committedSettings)
    }
  } catch (syncError) {
    syncWarning = getSyncWarningMessage(
      syncError,
      'Settings synchronization could not be completed.',
    )
  }

  return {
    committed: true,
    importedStores: targetStoreNames,
    settings: committedSettings,
    syncWarning,
  }
}

export async function resetLocalData() {
  let settings = null
  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.map((table) => table.clear()))
    settings = await ensureDefaultsWithinTransaction()
  })

  useSettingsStore.getState().setSettings(settings)
  return settings
}

export const settingsService = {
  applyDensityPreference,
  applyThemePreference,
  buildBackupData,
  createBackupFileName,
  importBackupData,
  loadSettings,
  resetLocalData,
  updateSettings,
  validateBackupData,
}

export const settingsServiceInternals = {
  defaultMvpSettings,
  ensureDefaultsWithinTransaction,
  normalizeSettings,
  reseedMissingDefaults,
  STORE_NAMES,
}

export { APPROVED_STORE_NAMES }
