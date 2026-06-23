import { categoryRepository } from '@/lib/db/repositories/categoryRepository.js'
import { merchantRuleRepository } from '@/lib/db/repositories/merchantRuleRepository.js'

import {
  MERCHANT_MATCH_TYPES,
  MERCHANT_RULE_SOURCES,
  matchMerchantRule,
  normalizeMerchantText,
} from './merchantRuleMatcher.js'

const USER_RULE_PRIORITY = 100
const DEFAULT_RULE_PRIORITY = 10

export const DEFAULT_PHILIPPINE_MERCHANT_RULES = [
  { categoryId: 'food', keyword: 'Jollibee' },
  { categoryId: 'food', keyword: 'McDonalds' },
  { categoryId: 'food', keyword: 'McDo' },
  { categoryId: 'food', keyword: 'KFC' },
  { categoryId: 'food', keyword: 'Chowking' },
  { categoryId: 'food', keyword: 'Mang Inasal' },
  { categoryId: 'food', keyword: 'Starbucks' },
  { categoryId: 'food', keyword: 'Coffee Bean' },
  { categoryId: 'food', keyword: 'Dunkin' },
  { categoryId: 'groceries', keyword: 'Puregold' },
  { categoryId: 'groceries', keyword: 'SM Supermarket' },
  { categoryId: 'groceries', keyword: 'Robinsons Supermarket' },
  { categoryId: 'groceries', keyword: 'Landmark' },
  { categoryId: 'groceries', keyword: 'WalterMart' },
  { categoryId: 'groceries', keyword: 'Dali' },
  { categoryId: 'groceries', keyword: 'S&R' },
  { categoryId: 'transport', keyword: 'Grab' },
  { categoryId: 'transport', keyword: 'JoyRide' },
  { categoryId: 'transport', keyword: 'Angkas' },
  { categoryId: 'transport', keyword: 'Move It' },
  { categoryId: 'transport', keyword: 'Lalamove' },
  { categoryId: 'bills', keyword: 'Meralco' },
  { categoryId: 'bills', keyword: 'Maynilad' },
  { categoryId: 'bills', keyword: 'PLDT' },
  { categoryId: 'bills', keyword: 'Globe' },
  { categoryId: 'bills', keyword: 'Smart' },
  { categoryId: 'bills', keyword: 'Converge' },
  { categoryId: 'bills', keyword: 'Manila Water' },
  { categoryId: 'shopping', keyword: 'Shopee' },
  { categoryId: 'shopping', keyword: 'Lazada' },
  { categoryId: 'shopping', keyword: 'TikTok Shop' },
  { categoryId: 'shopping', keyword: 'SM Store' },
  { categoryId: 'shopping', keyword: 'Uniqlo' },
  { categoryId: 'shopping', keyword: 'Watsons' },
  { categoryId: 'other', keyword: 'GCash' },
  { categoryId: 'other', keyword: 'Maya' },
]

function nowIso() {
  return new Date().toISOString()
}

function normalizeRulePayload(payload, existingRule = null) {
  const timestamp = nowIso()
  const keyword = String(payload.keyword ?? payload.merchantPattern ?? '').trim()
  const categoryId = String(payload.categoryId ?? '').trim()
  const matchType =
    payload.matchType === MERCHANT_MATCH_TYPES.exact
      ? MERCHANT_MATCH_TYPES.exact
      : MERCHANT_MATCH_TYPES.contains

  if (!keyword) {
    throw new Error('Merchant keyword is required')
  }

  if (!categoryId) {
    throw new Error('Category is required')
  }

  return {
    categoryId,
    confidence: payload.confidence ?? existingRule?.confidence ?? 1,
    createdAt: existingRule?.createdAt ?? payload.createdAt ?? timestamp,
    createdBy: payload.createdBy ?? existingRule?.createdBy ?? payload.source ?? 'user',
    keyword,
    matchType,
    paymentMethod: payload.paymentMethod ?? existingRule?.paymentMethod ?? null,
    priority:
      payload.priority ??
      existingRule?.priority ??
      (payload.source === MERCHANT_RULE_SOURCES.default
        ? DEFAULT_RULE_PRIORITY
        : USER_RULE_PRIORITY),
    source: payload.source ?? existingRule?.source ?? MERCHANT_RULE_SOURCES.user,
    updatedAt: timestamp,
  }
}

async function loadExpenseCategoryIds() {
  const categories = await categoryRepository.findByType('expense')
  return new Set(categories.map((category) => category.id))
}

async function assertValidCategory(categoryId) {
  const categoryIds = await loadExpenseCategoryIds()

  if (!categoryIds.has(categoryId)) {
    throw new Error('Category is not available for expense rules')
  }
}

function decorateRule(rule, categoriesById) {
  return {
    ...rule,
    categoryName: categoriesById.get(rule.categoryId)?.name ?? 'Uncategorized',
    matchType: rule.matchType ?? MERCHANT_MATCH_TYPES.contains,
    priority: rule.priority ?? 0,
    source: rule.source ?? rule.createdBy ?? MERCHANT_RULE_SOURCES.default,
  }
}

async function loadRulesAndCategories() {
  const [rules, categories] = await Promise.all([
    merchantRuleRepository.findAll(),
    categoryRepository.findByType('expense'),
  ])
  const categoriesById = new Map(
    categories.map((category) => [category.id, category]),
  )

  return {
    categories,
    rules: rules.map((rule) => decorateRule(rule, categoriesById)),
  }
}

async function findRuleByNormalizedKeyword(keyword, source = null) {
  const normalizedKeyword = normalizeMerchantText(keyword)
  const rules = await merchantRuleRepository.findAll()

  return rules.find((rule) => {
    const sameKeyword = normalizeMerchantText(rule.keyword) === normalizedKeyword
    const sameSource = !source || (rule.source ?? rule.createdBy) === source
    return sameKeyword && sameSource
  })
}

export const merchantRuleService = {
  async seedDefaultRules() {
    const timestamp = nowIso()
    const categoryIds = await loadExpenseCategoryIds()
    const existingRules = await merchantRuleRepository.findAll()

    let seeded = 0

    await Promise.all(
      DEFAULT_PHILIPPINE_MERCHANT_RULES.filter((rule) =>
        categoryIds.has(rule.categoryId),
      ).map(async (rule) => {
        const existingRule = existingRules.find(
          (candidate) =>
            normalizeMerchantText(candidate.keyword) ===
              normalizeMerchantText(rule.keyword) &&
            (candidate.source ?? candidate.createdBy) !== MERCHANT_RULE_SOURCES.user,
        )
        const nextRule = normalizeRulePayload({
          ...rule,
          createdAt: existingRule?.createdAt ?? timestamp,
          createdBy: MERCHANT_RULE_SOURCES.default,
          matchType: MERCHANT_MATCH_TYPES.contains,
          priority: DEFAULT_RULE_PRIORITY,
          source: MERCHANT_RULE_SOURCES.default,
        }, existingRule)

        if (existingRule) {
          await merchantRuleRepository.update(existingRule.id, nextRule)
          return
        }

        seeded += 1
        await merchantRuleRepository.create(nextRule)
      }),
    )

    return { seeded }
  },

  async loadRules(filters = {}) {
    await this.seedDefaultRules()
    const { categories, rules } = await loadRulesAndCategories()
    const search = normalizeMerchantText(filters.search)

    const filteredRules = rules
      .filter((rule) => !filters.categoryId || rule.categoryId === filters.categoryId)
      .filter((rule) => !filters.source || rule.source === filters.source)
      .filter(
        (rule) =>
          !search ||
          normalizeMerchantText(rule.keyword).includes(search) ||
          normalizeMerchantText(rule.categoryName).includes(search),
      )
      .sort((firstRule, secondRule) => {
        if ((firstRule.source ?? '') !== (secondRule.source ?? '')) {
          return firstRule.source === MERCHANT_RULE_SOURCES.user ? -1 : 1
        }

        return firstRule.keyword.localeCompare(secondRule.keyword)
      })

    return {
      categories,
      rules: filteredRules,
    }
  },

  async createRule(payload) {
    const normalizedRule = normalizeRulePayload({
      ...payload,
      source: MERCHANT_RULE_SOURCES.user,
    })
    await assertValidCategory(normalizedRule.categoryId)

    const existingRule = await findRuleByNormalizedKeyword(
      normalizedRule.keyword,
      MERCHANT_RULE_SOURCES.user,
    )

    if (existingRule) {
      throw new Error('A user rule already exists for this merchant')
    }

    const id = await merchantRuleRepository.create(normalizedRule)
    return merchantRuleRepository.findById(id)
  },

  async updateRule(id, payload) {
    const existingRule = await merchantRuleRepository.findById(id)

    if (!existingRule) {
      throw new Error('Merchant rule not found')
    }

    if ((existingRule.source ?? existingRule.createdBy) === MERCHANT_RULE_SOURCES.default) {
      throw new Error('Default merchant rules cannot be edited')
    }

    const normalizedRule = normalizeRulePayload(payload, existingRule)
    await assertValidCategory(normalizedRule.categoryId)
    await merchantRuleRepository.update(id, normalizedRule)
    return merchantRuleRepository.findById(id)
  },

  async deleteRule(id) {
    const existingRule = await merchantRuleRepository.findById(id)

    if (!existingRule) {
      throw new Error('Merchant rule not found')
    }

    if ((existingRule.source ?? existingRule.createdBy) === MERCHANT_RULE_SOURCES.default) {
      throw new Error('Default merchant rules cannot be deleted')
    }

    await merchantRuleRepository.remove(id)
    return id
  },

  async suggestCategoryForMerchant(merchant) {
    await this.seedDefaultRules()
    const rules = await merchantRuleRepository.findAll()
    return matchMerchantRule(merchant, rules)
  },

  async learnCategoryCorrection({ categoryId, merchant }) {
    const keyword = String(merchant ?? '').trim()

    if (!keyword || /^unknown merchant$/i.test(keyword)) {
      return { learned: false, rule: null }
    }

    await assertValidCategory(categoryId)

    const existingUserRule = await findRuleByNormalizedKeyword(
      keyword,
      MERCHANT_RULE_SOURCES.user,
    )
    const normalizedRule = normalizeRulePayload(
      {
        categoryId,
        keyword,
        matchType: MERCHANT_MATCH_TYPES.contains,
        priority: USER_RULE_PRIORITY,
        source: MERCHANT_RULE_SOURCES.user,
      },
      existingUserRule,
    )

    if (existingUserRule) {
      await merchantRuleRepository.update(existingUserRule.id, normalizedRule)
      return {
        learned: true,
        rule: await merchantRuleRepository.findById(existingUserRule.id),
      }
    }

    const id = await merchantRuleRepository.create(normalizedRule)
    return {
      learned: true,
      rule: await merchantRuleRepository.findById(id),
    }
  },
}

export const merchantRuleServiceInternals = {
  DEFAULT_RULE_PRIORITY,
  USER_RULE_PRIORITY,
  normalizeRulePayload,
}
