import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { clearDatabase } from '@/lib/db/devTools.js'
import { db } from '@/lib/db/dexie.js'
import { merchantRuleRepository } from '@/lib/db/repositories/merchantRuleRepository.js'
import { seedDatabase } from '@/lib/db/seed.js'

import {
  MERCHANT_MATCH_TYPES,
  MERCHANT_RULE_SOURCES,
} from './merchantRuleMatcher.js'
import {
  DEFAULT_PHILIPPINE_MERCHANT_RULES,
  merchantRuleService,
} from './merchantRuleService.js'

beforeEach(async () => {
  await db.open()
  await clearDatabase()
  await seedDatabase()
})

afterEach(async () => {
  await clearDatabase()
  db.close()
})

describe('merchantRuleService', () => {
  it('seeds default Philippine rules idempotently using existing categories', async () => {
    await merchantRuleService.seedDefaultRules()
    const firstSeedRules = await merchantRuleRepository.findAll()

    await merchantRuleService.seedDefaultRules()
    const secondSeedRules = await merchantRuleRepository.findAll()

    expect(secondSeedRules).toHaveLength(firstSeedRules.length)
    expect(secondSeedRules.length).toBeGreaterThanOrEqual(
      DEFAULT_PHILIPPINE_MERCHANT_RULES.length,
    )
    expect(secondSeedRules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          categoryId: 'food',
          keyword: 'Starbucks',
          source: MERCHANT_RULE_SOURCES.default,
        }),
        expect.objectContaining({
          categoryId: 'bills',
          keyword: 'PLDT',
          source: MERCHANT_RULE_SOURCES.default,
        }),
      ]),
    )
  })

  it('creates, updates, and deletes user rules', async () => {
    const createdRule = await merchantRuleService.createRule({
      categoryId: 'bills',
      keyword: 'Coworking Space',
      matchType: MERCHANT_MATCH_TYPES.contains,
    })

    expect(createdRule).toMatchObject({
      categoryId: 'bills',
      keyword: 'Coworking Space',
      source: MERCHANT_RULE_SOURCES.user,
    })

    const updatedRule = await merchantRuleService.updateRule(createdRule.id, {
      categoryId: 'shopping',
      keyword: 'Coworking Space',
      matchType: MERCHANT_MATCH_TYPES.exact,
    })

    expect(updatedRule).toMatchObject({
      categoryId: 'shopping',
      matchType: MERCHANT_MATCH_TYPES.exact,
    })

    await merchantRuleService.deleteRule(createdRule.id)

    await expect(merchantRuleRepository.findById(createdRule.id)).resolves.toBeUndefined()
  })

  it('prevents duplicate user rules for the same merchant', async () => {
    await merchantRuleService.createRule({
      categoryId: 'food',
      keyword: 'Local Cafe',
    })

    await expect(
      merchantRuleService.createRule({
        categoryId: 'shopping',
        keyword: ' local   cafe ',
      }),
    ).rejects.toThrow('A user rule already exists for this merchant')
  })

  it('learns corrections and lets user rules override default rules', async () => {
    await merchantRuleService.seedDefaultRules()

    const learnResult = await merchantRuleService.learnCategoryCorrection({
      categoryId: 'shopping',
      merchant: 'Starbucks',
    })

    expect(learnResult).toMatchObject({
      learned: true,
      rule: expect.objectContaining({
        categoryId: 'shopping',
        keyword: 'Starbucks',
        source: MERCHANT_RULE_SOURCES.user,
      }),
    })

    await expect(
      merchantRuleService.suggestCategoryForMerchant('Starbucks Reserve'),
    ).resolves.toMatchObject({
      categoryId: 'shopping',
      matched: true,
    })
  })

  it('updates existing learned rules and ignores unknown merchants', async () => {
    const firstLearn = await merchantRuleService.learnCategoryCorrection({
      categoryId: 'food',
      merchant: 'Cafe Roma',
    })
    const secondLearn = await merchantRuleService.learnCategoryCorrection({
      categoryId: 'bills',
      merchant: 'Cafe Roma',
    })

    expect(secondLearn.rule.id).toBe(firstLearn.rule.id)
    expect(secondLearn.rule.categoryId).toBe('bills')

    await expect(
      merchantRuleService.learnCategoryCorrection({
        categoryId: 'food',
        merchant: 'Unknown Merchant',
      }),
    ).resolves.toMatchObject({
      learned: false,
      rule: null,
    })
  })
})
