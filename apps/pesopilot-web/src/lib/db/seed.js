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

export async function seedDatabase() {
  const timestamp = nowIso()

  await db.transaction('rw', db.categories, db.merchant_rules, db.settings, async () => {
    await db.categories.bulkPut(
      defaultCategories.map((category) => ({
        ...category,
        isSystem: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      })),
    )

    await Promise.all(
      defaultMerchantRules.map(async (rule) => {
        const existingRule = await db.merchant_rules
          .where('keyword')
          .equals(rule.keyword)
          .first()

        if (existingRule) {
          return db.merchant_rules.update(existingRule.id, {
            ...rule,
            paymentMethod: null,
            confidence: 1,
            createdBy: 'system',
            updatedAt: timestamp,
          })
        }

        return db.merchant_rules.add({
          ...rule,
          paymentMethod: null,
          confidence: 1,
          createdBy: 'system',
          createdAt: timestamp,
          updatedAt: timestamp,
        })
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
