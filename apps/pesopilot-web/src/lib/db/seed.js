import { db } from './dexie.js'
import { DEFAULT_SETTINGS_ID } from './schema.js'

const nowIso = () => new Date().toISOString()

export const defaultCategories = [
  { id: 'food', name: 'Food', type: 'expense', icon: 'utensils', color: '#2563eb' },
  {
    id: 'transport',
    name: 'Transport',
    type: 'expense',
    icon: 'bus',
    color: '#004ac6',
  },
  { id: 'bills', name: 'Bills', type: 'expense', icon: 'receipt', color: '#f59e0b' },
  {
    id: 'groceries',
    name: 'Groceries',
    type: 'expense',
    icon: 'shopping-basket',
    color: '#006c49',
  },
  {
    id: 'shopping',
    name: 'Shopping',
    type: 'expense',
    icon: 'shopping-bag',
    color: '#784b00',
  },
  {
    id: 'savings',
    name: 'Savings',
    type: 'savings',
    icon: 'piggy-bank',
    color: '#006c49',
  },
  { id: 'income', name: 'Income', type: 'income', icon: 'wallet', color: '#006c49' },
  {
    id: 'emergency',
    name: 'Emergency',
    type: 'expense',
    icon: 'shield-alert',
    color: '#ba1a1a',
  },
  { id: 'other', name: 'Other', type: 'expense', icon: 'circle', color: '#737686' },
]

export const defaultMerchantRules = [
  { keyword: 'Jollibee', categoryId: 'food' },
  { keyword: 'McDo', categoryId: 'food' },
  { keyword: '7-Eleven', categoryId: 'groceries' },
  { keyword: 'Meralco', categoryId: 'bills' },
  { keyword: 'Maynilad', categoryId: 'bills' },
  { keyword: 'GCash', categoryId: 'other' },
  { keyword: 'Maya', categoryId: 'other' },
  { keyword: 'Shopee', categoryId: 'shopping' },
  { keyword: 'Lazada', categoryId: 'shopping' },
  { keyword: 'Jeepney', categoryId: 'transport' },
  { keyword: 'Tricycle', categoryId: 'transport' },
  { keyword: 'Angkas', categoryId: 'transport' },
  { keyword: 'Move It', categoryId: 'transport' },
]

export const defaultSettings = {
  id: DEFAULT_SETTINGS_ID,
  currency: 'PHP',
  locale: 'en-PH',
  aiMode: 'rules_only',
  salaryMode: 'semi_monthly',
  theme: 'light',
  cloudAiConsent: false,
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

export async function seedDatabase() {
  const timestamp = nowIso()

  await db.transaction('rw', db.categories, db.merchant_rules, db.settings, async () => {
    await db.categories.bulkPut(
      defaultCategories.map((category) => withSystemMetadata(category, timestamp)),
    )

    await Promise.all(
      defaultMerchantRules.map(async (rule) => {
        const existingRule = await db.merchant_rules
          .where('keyword')
          .equals(rule.keyword)
          .first()

        if (existingRule) {
          return db.merchant_rules.update(
            existingRule.id,
            normalizeDefaultMerchantRule(rule, timestamp, existingRule),
          )
        }

        return db.merchant_rules.add(normalizeDefaultMerchantRule(rule, timestamp))
      }),
    )

    const existingSettings = await db.settings.get(DEFAULT_SETTINGS_ID)
    await db.settings.put({
      ...defaultSettings,
      createdAt: existingSettings?.createdAt ?? timestamp,
      updatedAt: timestamp,
    })
  })
}

export async function ensureApplicationDefaults() {
  const timestamp = nowIso()
  const result = {
    categoriesSeeded: false,
    merchantRulesSeeded: false,
    settingsSeeded: false,
  }

  await db.transaction('rw', db.categories, db.merchant_rules, db.settings, async () => {
    const existingCategories = await db.categories.toArray()
    const categoriesById = new Map(
      existingCategories.map((category) => [category.id, category]),
    )
    const missingCategories = defaultCategories.filter(
      (category) => !categoriesById.has(category.id),
    )

    if (missingCategories.length > 0) {
      await db.categories.bulkPut(
        missingCategories.map((category) =>
          withSystemMetadata(category, timestamp, categoriesById.get(category.id)),
        ),
      )
      result.categoriesSeeded = true
    }

    const existingSettings = await db.settings.get(DEFAULT_SETTINGS_ID)

    if (!existingSettings) {
      await db.settings.put({
        ...defaultSettings,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      result.settingsSeeded = true
    }

    const existingRules = await db.merchant_rules.toArray()

    await Promise.all(
      defaultMerchantRules.map(async (rule) => {
        const existingRule = existingRules.find(
          (candidate) => candidate.keyword === rule.keyword,
        )

        if (existingRule) {
          return
        }

        await db.merchant_rules.add(normalizeDefaultMerchantRule(rule, timestamp))
        result.merchantRulesSeeded = true
      }),
    )
  })

  return result
}
