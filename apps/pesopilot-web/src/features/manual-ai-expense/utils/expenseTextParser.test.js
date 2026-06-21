import { describe, expect, it } from 'vitest'

import { MANUAL_AI_DETECTED_SOURCE, parseExpenseText } from './expenseTextParser.js'

const referenceDate = '2026-06-21'

describe('parseExpenseText', () => {
  it('parses amount, merchant, yesterday, payment method, and category', () => {
    expect(
      parseExpenseText('Bought Jollibee for 250 yesterday using GCash', {
        referenceDate,
      }),
    ).toMatchObject({
      amount: 250,
      detectedSource: MANUAL_AI_DETECTED_SOURCE,
      merchant: 'Jollibee',
      suggestedCategoryId: 'food',
      suggestedPaymentMethod: 'GCash',
      transactionDate: '2026-06-20',
    })
  })

  it('parses peso-formatted and comma amounts', () => {
    expect(parseExpenseText('Paid PHP 1,250.50 today cash', { referenceDate }))
      .toMatchObject({
        amount: 1250.5,
        suggestedPaymentMethod: 'Cash',
        transactionDate: '2026-06-21',
      })

    expect(parseExpenseText('Meralco ₱1850 today', { referenceDate }))
      .toMatchObject({
        amount: 1850,
        merchant: 'Meralco',
        suggestedCategoryId: 'bills',
      })
  })

  it('parses exact date formats', () => {
    expect(parseExpenseText('Shopee order 999 on 2026-06-20', { referenceDate }))
      .toMatchObject({
        amount: 999,
        merchant: 'Shopee',
        suggestedCategoryId: 'shopping',
        transactionDate: '2026-06-20',
      })

    expect(parseExpenseText('Coffee at Starbucks 180 on 06/19/2026', {
      referenceDate,
    })).toMatchObject({
      merchant: 'Starbucks',
      transactionDate: '2026-06-19',
    })
  })

  it('parses the other day as two days before the reference date', () => {
    expect(
      parseExpenseText('Bought Starbucks 385 the other day using Cash', {
        referenceDate,
      }),
    ).toMatchObject({
      amount: 385,
      merchant: 'Starbucks',
      suggestedPaymentMethod: 'Cash',
      transactionDate: '2026-06-19',
    })
  })

  it('detects bank aliases as bank transfer', () => {
    expect(parseExpenseText('Paid Maynilad 1200 using BPI', { referenceDate }))
      .toMatchObject({
        merchant: 'Maynilad',
        suggestedPaymentMethod: 'Bank Transfer',
      })
  })

  it('does not treat 7-Eleven merchant number as the amount', () => {
    expect(parseExpenseText('7-Eleven snacks 85 today cash', { referenceDate }))
      .toMatchObject({
        amount: 85,
        merchant: '7-Eleven',
        suggestedPaymentMethod: 'Cash',
      })
  })

  it('prefers expense amounts over tendered cash amounts', () => {
    expect(
      parseExpenseText(
        'Bought Starbucks worth 385 pesos yesterday using 1000 pesos cash',
        { referenceDate },
      ),
    ).toMatchObject({
      amount: 385,
      merchant: 'Starbucks',
      suggestedPaymentMethod: 'Cash',
    })

    expect(parseExpenseText('Paid 385 at Starbucks using 1000 cash', {
      referenceDate,
    })).toMatchObject({
      amount: 385,
      merchant: 'Starbucks',
      suggestedPaymentMethod: 'Cash',
    })

    expect(parseExpenseText('Coffee at Starbucks 180 paid with 500 cash', {
      referenceDate,
    })).toMatchObject({
      amount: 180,
      merchant: 'Starbucks',
      suggestedPaymentMethod: 'Cash',
    })

    expect(parseExpenseText('Bought Jollibee for 250 using 1000 cash', {
      referenceDate,
    })).toMatchObject({
      amount: 250,
      merchant: 'Jollibee',
      suggestedPaymentMethod: 'Cash',
    })
  })

  it('falls back to unknown merchant and category warnings', () => {
    const result = parseExpenseText('Spent 123', { referenceDate })

    expect(result).toMatchObject({
      amount: 123,
      merchant: 'Unknown Merchant',
      suggestedCategoryId: 'other',
    })
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        'Could not confidently detect merchant.',
        'Could not detect payment method.',
        'Could not confidently guess category.',
      ]),
    )
  })

  it('returns warnings and lower confidence for incomplete input', () => {
    const weakResult = parseExpenseText('maybe lunch', { referenceDate })
    const strongResult = parseExpenseText(
      'Lunch 150 at McDonalds today using Cash',
      { referenceDate },
    )

    expect(weakResult.amount).toBeNull()
    expect(weakResult.warnings).toContain('Could not confidently detect amount.')
    expect(strongResult.confidence).toBeGreaterThan(weakResult.confidence)
  })

  it('lowers confidence when date falls back to today', () => {
    const fallbackDateResult = parseExpenseText('Coffee at Starbucks 180 cash', {
      referenceDate,
    })
    const detectedDateResult = parseExpenseText(
      'Coffee at Starbucks 180 today cash',
      { referenceDate },
    )

    expect(fallbackDateResult.transactionDate).toBe('2026-06-21')
    expect(fallbackDateResult.warnings).toContain(
      'Could not confidently detect date. Using today as fallback.',
    )
    expect(fallbackDateResult.confidence).toBeLessThan(
      detectedDateResult.confidence,
    )
  })
})
