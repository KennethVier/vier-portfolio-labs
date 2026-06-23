import { describe, expect, it } from 'vitest'

import {
  MERCHANT_MATCH_TYPES,
  matchMerchantRule,
  normalizeMerchantText,
} from './merchantRuleMatcher.js'

describe('merchantRuleMatcher', () => {
  it('normalizes merchant text', () => {
    expect(normalizeMerchantText('  Jollibee   Putatan  ')).toBe(
      'jollibee putatan',
    )
  })

  it('matches exact and contains rules case-insensitively', () => {
    expect(
      matchMerchantRule('JOLLIBEE', [
        {
          categoryId: 'food',
          id: 1,
          keyword: 'jollibee',
          matchType: MERCHANT_MATCH_TYPES.exact,
          priority: 1,
        },
      ]),
    ).toMatchObject({
      categoryId: 'food',
      matched: true,
      merchantRuleId: 1,
    })

    expect(
      matchMerchantRule('Jollibee Putatan', [
        {
          categoryId: 'food',
          id: 2,
          keyword: 'Jollibee',
          matchType: MERCHANT_MATCH_TYPES.contains,
          priority: 1,
        },
      ]),
    ).toMatchObject({
      categoryId: 'food',
      matched: true,
      merchantRuleId: 2,
    })
  })

  it('uses priority before match type and keyword length', () => {
    expect(
      matchMerchantRule('Starbucks Reserve', [
        {
          categoryId: 'food',
          id: 1,
          keyword: 'Starbucks Reserve',
          matchType: MERCHANT_MATCH_TYPES.exact,
          priority: 1,
        },
        {
          categoryId: 'other',
          id: 2,
          keyword: 'Starbucks',
          matchType: MERCHANT_MATCH_TYPES.contains,
          priority: 10,
        },
      ]),
    ).toMatchObject({
      categoryId: 'other',
      merchantRuleId: 2,
    })
  })

  it('prefers exact and then longer keyword when priority ties', () => {
    expect(
      matchMerchantRule('Starbucks Reserve', [
        {
          categoryId: 'food',
          id: 1,
          keyword: 'Starbucks',
          matchType: MERCHANT_MATCH_TYPES.contains,
          priority: 1,
        },
        {
          categoryId: 'shopping',
          id: 2,
          keyword: 'Starbucks Reserve',
          matchType: MERCHANT_MATCH_TYPES.exact,
          priority: 1,
        },
      ]),
    ).toMatchObject({
      categoryId: 'shopping',
      merchantRuleId: 2,
    })

    expect(
      matchMerchantRule('SM Supermarket Aura', [
        {
          categoryId: 'shopping',
          id: 3,
          keyword: 'SM',
          matchType: MERCHANT_MATCH_TYPES.contains,
          priority: 1,
        },
        {
          categoryId: 'groceries',
          id: 4,
          keyword: 'SM Supermarket',
          matchType: MERCHANT_MATCH_TYPES.contains,
          priority: 1,
        },
      ]),
    ).toMatchObject({
      categoryId: 'groceries',
      merchantRuleId: 4,
    })
  })

  it('returns a safe fallback when no rule matches', () => {
    expect(matchMerchantRule('Unknown Shop', [])).toMatchObject({
      categoryId: null,
      confidence: 0,
      matched: false,
      merchantRuleId: null,
      source: 'unknown',
    })
  })
})
