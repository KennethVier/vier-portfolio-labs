import { describe, expect, it } from 'vitest'

import {
  RISK_LEVELS,
  RISK_SIGNAL_CODES,
} from '../constants/budgetShockConstants.js'
import {
  budgetShockRecommendationService,
  generateRecommendation,
} from './budgetShockRecommendationService.js'

describe('budgetShockRecommendationService', () => {
  it('exposes generateRecommendation on budgetShockRecommendationService singleton', () => {
    expect(budgetShockRecommendationService.generateRecommendation).toBe(generateRecommendation)
  })

  it('returns null for Green risk level', () => {
    const risk = {
      level: RISK_LEVELS.green,
      cutoffId: 1,
      primaryReasonCode: null,
    }
    expect(generateRecommendation(risk)).toBeNull()
  })

  it('maps Yellow burn-rate monitor recommendation', () => {
    const risk = {
      level: RISK_LEVELS.yellow,
      cutoffId: 1,
      primaryReasonCode: RISK_SIGNAL_CODES.BURN_NEAR_SAFE,
    }
    const rec = generateRecommendation(risk)
    expect(rec).not.toBeNull()
    expect(rec.recommendedAction).toBe('Monitor spending for the remainder of the cutoff.')
    expect(rec.severity).toBe('info')
    expect(rec.domain).toBe('cashflow')
  })

  it('maps Yellow category budget watch recommendation', () => {
    const risk = {
      level: RISK_LEVELS.yellow,
      cutoffId: 1,
      primaryReasonCode: RISK_SIGNAL_CODES.CATEGORY_BUDGET_WATCH,
    }
    const rec = generateRecommendation(risk)
    expect(rec).not.toBeNull()
    expect(rec.recommendedAction).toBe(
      'Review spending in the category approaching its planned budget.',
    )
  })

  it('maps Orange burn-rate overspending recommendation', () => {
    const risk = {
      level: RISK_LEVELS.orange,
      cutoffId: 1,
      primaryReasonCode: RISK_SIGNAL_CODES.BURN_EXCEEDS_SAFE,
    }
    const rec = generateRecommendation(risk)
    expect(rec).not.toBeNull()
    expect(rec.recommendedAction).toBe(
      'Keep discretionary daily spending at or below the current safe daily spend for the remaining cutoff days.',
    )
    expect(rec.severity).toBe('warning')
    expect(rec.priority).toBe('high')
  })

  it('maps Orange category budget warning recommendation', () => {
    const risk = {
      level: RISK_LEVELS.orange,
      cutoffId: 1,
      primaryReasonCode: RISK_SIGNAL_CODES.CATEGORY_BUDGET_WARNING,
    }
    const rec = generateRecommendation(risk)
    expect(rec).not.toBeNull()
    expect(rec.recommendedAction).toBe(
      'Review additional spending in the category that reached the budget warning threshold.',
    )
  })

  it('maps Red projected deficit recommendation', () => {
    const risk = {
      level: RISK_LEVELS.red,
      cutoffId: 1,
      primaryReasonCode: RISK_SIGNAL_CODES.PROJECTED_DEFICIT,
      projectedDeficit: 2500,
    }
    const rec = generateRecommendation(risk)
    expect(rec).not.toBeNull()
    expect(rec.recommendedAction).toBe(
      'Review remaining cutoff expenses and reduce discretionary spending where possible to address the projected shortfall.',
    )
    expect(rec.severity).toBe('critical')
    expect(rec.priority).toBe('urgent')
    expect(rec.explanation).toContain('shortfall of ₱2,500.00')
  })

  it('maps Red category budget overage recommendation', () => {
    const risk = {
      level: RISK_LEVELS.red,
      cutoffId: 1,
      primaryReasonCode: RISK_SIGNAL_CODES.CATEGORY_OVER_BUDGET,
    }
    const rec = generateRecommendation(risk)
    expect(rec).not.toBeNull()
    expect(rec.recommendedAction).toBe(
      'Review remaining cutoff expenses and reduce discretionary spending where possible to address the category budget overage.',
    )
  })

  it('strictly adheres to safety boundaries: no prohibited financial advice words', () => {
    const codes = Object.values(RISK_SIGNAL_CODES)
    const levels = [RISK_LEVELS.yellow, RISK_LEVELS.orange, RISK_LEVELS.red]

    const prohibitedWords = ['loan', 'borrow', 'credit', 'investment', 'tax', 'guaranteed']

    for (const level of levels) {
      for (const code of codes) {
        const rec = generateRecommendation({
          level,
          cutoffId: 1,
          primaryReasonCode: code,
          projectedDeficit: 1000,
        })

        if (rec) {
          const combined = `${rec.title} ${rec.explanation} ${rec.recommendedAction}`.toLowerCase()
          for (const word of prohibitedWords) {
            expect(combined).not.toContain(word)
          }
        }
      }
    }
  })
})
