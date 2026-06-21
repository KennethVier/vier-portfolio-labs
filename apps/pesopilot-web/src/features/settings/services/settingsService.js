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
  seedDatabase,
} from '@/lib/db/seed.js'
import {
  categoryRepository,
  merchantRuleRepository,
  settingsRepository,
} from '@/lib/db/repositories/index.js'

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

export function validateBackupData(backupData) {
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

  Object.entries(backupData.stores).forEach(([storeName, records]) => {
    if (!APPROVED_STORE_NAMES.includes(storeName)) {
      return
    }

    if (!Array.isArray(records)) {
      throw new Error(`Invalid backup file. Store "${storeName}" must be an array.`)
    }
  })

  return true
}

async function reseedMissingDefaults() {
  const [settings, categories, merchantRules] = await Promise.all([
    settingsRepository.getSettings(),
    categoryRepository.findAll(),
    merchantRuleRepository.findAll(),
  ])

  if (
    !settings ||
    categories.length < defaultCategories.length ||
    merchantRules.length < defaultMerchantRules.length
  ) {
    await seedDatabase()
  }
}

export async function importBackupData(backupData) {
  validateBackupData(backupData)

  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.map((table) => table.clear()))

    await Promise.all(
      APPROVED_STORE_NAMES.map(async (storeName) => {
        const records = backupData.stores[storeName]
        if (!Array.isArray(records) || records.length === 0) {
          return
        }

        await db.table(storeName).bulkPut(records)
      }),
    )
  })

  await reseedMissingDefaults()
  const settings = await ensureSettings()
  useSettingsStore.getState().setSettings(settings)

  return {
    importedStores: Object.keys(backupData.stores).filter((storeName) =>
      APPROVED_STORE_NAMES.includes(storeName),
    ),
    settings,
  }
}

export async function resetLocalData() {
  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.map((table) => table.clear()))
  })

  await seedDatabase()
  const settings = await ensureSettings()
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
  normalizeSettings,
  STORE_NAMES,
}
