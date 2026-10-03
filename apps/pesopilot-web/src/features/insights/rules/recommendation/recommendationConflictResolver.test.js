import { describe, expect, it } from 'vitest'

import {
  compareRecommendations,
  resolveRecommendationConflicts,
} from './recommendationConflictResolver.js'

describe('recommendationConflictResolver', () => {
  describe('compareRecommendations', () => {
    it('orders by severity first (critical > warning > info)', () => {
      const criticalRec = {
        id: 'rec_b',
        severity: 'critical',
        priority: 'low',
        domain: 'savings',
      }
      const warningRec = {
        id: 'rec_a',
        severity: 'warning',
        priority: 'urgent',
        domain: 'cashflow',
      }

      // Critical must outrank warning even if warning has urgent priority
      expect(compareRecommendations(criticalRec, warningRec)).toBeLessThan(0)
      expect(compareRecommendations(warningRec, criticalRec)).toBeGreaterThan(0)
    })

    it('orders by priority when severity is identical', () => {
      const urgentRec = {
        id: 'rec_b',
        severity: 'warning',
        priority: 'urgent',
        domain: 'savings',
      }
      const highRec = {
        id: 'rec_a',
        severity: 'warning',
        priority: 'high',
        domain: 'cashflow',
      }

      expect(compareRecommendations(urgentRec, highRec)).toBeLessThan(0)
      expect(compareRecommendations(highRec, urgentRec)).toBeGreaterThan(0)
    })

    it('orders by domain when severity and priority are identical', () => {
      const cashflowRec = {
        id: 'rec_z',
        severity: 'warning',
        priority: 'medium',
        domain: 'cashflow',
      }
      const expenseRec = {
        id: 'rec_a',
        severity: 'warning',
        priority: 'medium',
        domain: 'expense',
      }

      // DOMAINS_ORDER puts cashflow before expense
      expect(compareRecommendations(cashflowRec, expenseRec)).toBeLessThan(0)
      expect(compareRecommendations(expenseRec, cashflowRec)).toBeGreaterThan(0)
    })

    it('breaks ties deterministically by ID ascending', () => {
      const recA = {
        id: 'alpha',
        severity: 'warning',
        priority: 'medium',
        domain: 'expense',
      }
      const recB = {
        id: 'beta',
        severity: 'warning',
        priority: 'medium',
        domain: 'expense',
      }

      expect(compareRecommendations(recA, recB)).toBeLessThan(0)
      expect(compareRecommendations(recB, recA)).toBeGreaterThan(0)
    })
  })

  describe('resolveRecommendationConflicts', () => {
    it('filters out candidates with missing or empty evidence or sourceRuleIds', () => {
      const candidates = [
        {
          id: 'valid_1',
          actionKey: 'act_1',
          severity: 'warning',
          priority: 'medium',
          domain: 'expense',
          evidence: [{ label: 'L', value: 1 }],
          sourceRuleIds: ['rule_1'],
        },
        {
          id: 'invalid_no_evidence',
          actionKey: 'act_2',
          severity: 'critical',
          priority: 'urgent',
          domain: 'cashflow',
          evidence: [],
          sourceRuleIds: ['rule_2'],
        },
        {
          id: 'invalid_no_rule_ids',
          actionKey: 'act_3',
          severity: 'critical',
          priority: 'urgent',
          domain: 'cashflow',
          evidence: [{ label: 'L', value: 1 }],
          sourceRuleIds: [],
        },
      ]

      const { recommendations } = resolveRecommendationConflicts(candidates)
      expect(recommendations.length).toBe(1)
      expect(recommendations[0].id).toBe('valid_1')
    })

    it('deduplicates by actionKey and records suppression with evidence', () => {
      const candidates = [
        {
          id: 'expense_category',
          actionKey: 'review_expenses',
          domain: 'expense',
          severity: 'warning',
          priority: 'medium',
          evidence: [{ label: 'Category', value: 'Dining' }],
          sourceRuleIds: ['top_spending_category'],
        },
        {
          id: 'expense_trend',
          actionKey: 'review_expenses',
          domain: 'expense',
          severity: 'warning',
          priority: 'medium',
          evidence: [{ label: 'Trend', value: '+20%' }],
          sourceRuleIds: ['expense_trend'],
        },
      ]

      const { recommendations, suppressed } =
        resolveRecommendationConflicts(candidates)
      expect(recommendations.length).toBe(1)
      // expense_category < expense_trend alphabetically for ID tie-break
      expect(recommendations[0].id).toBe('expense_category')
      expect(recommendations[0].rank).toBe(1)

      expect(suppressed.length).toBe(1)
      expect(suppressed[0].id).toBe('expense_trend')
      expect(suppressed[0].reason).toBe('duplicate_action')
      expect(suppressed[0].suppressedBy).toBe('expense_category')
      expect(suppressed[0].evidence.length).toBe(1)
    })

    it('critical cashflow signal suppresses lower-severity savings/goal actions', () => {
      const candidates = [
        {
          id: 'cashflow_negative',
          actionKey: 'review_cash_position',
          domain: 'cashflow',
          severity: 'critical',
          priority: 'urgent',
          evidence: [{ label: 'Cash', value: -100 }],
          sourceRuleIds: ['remaining_cash'],
        },
        {
          id: 'savings_rate',
          actionKey: 'review_savings_allocation',
          domain: 'savings',
          severity: 'warning',
          priority: 'medium',
          evidence: [{ label: 'Savings Rate', value: 2 }],
          sourceRuleIds: ['savings_rate'],
        },
        {
          id: 'goal_no_contributions',
          actionKey: 'review_goal_contributions',
          domain: 'goal',
          severity: 'info',
          priority: 'low',
          evidence: [{ label: 'Goals', value: 1 }],
          sourceRuleIds: ['goals_without_contributions'],
        },
      ]

      const { recommendations, suppressed } =
        resolveRecommendationConflicts(candidates)
      expect(recommendations.map((r) => r.id)).toEqual(['cashflow_negative'])
      expect(suppressed.map((s) => s.id).sort()).toEqual([
        'goal_no_contributions',
        'savings_rate',
      ])
      expect(
        suppressed.every((s) => s.reason === 'contradicted_by_cashflow'),
      ).toBe(true)
    })

    it('shuffling input array gives exact same ranking and output', () => {
      const candidates = [
        {
          id: 'rec_c',
          actionKey: 'act_c',
          domain: 'health',
          severity: 'warning',
          priority: 'high',
          evidence: [{ label: 'E', value: 1 }],
          sourceRuleIds: ['r_c'],
        },
        {
          id: 'rec_a',
          actionKey: 'act_a',
          domain: 'cashflow',
          severity: 'critical',
          priority: 'urgent',
          evidence: [{ label: 'E', value: 1 }],
          sourceRuleIds: ['r_a'],
        },
        {
          id: 'rec_b',
          actionKey: 'act_b',
          domain: 'expense',
          severity: 'warning',
          priority: 'medium',
          evidence: [{ label: 'E', value: 1 }],
          sourceRuleIds: ['r_b'],
        },
      ]

      const result1 = resolveRecommendationConflicts([...candidates])
      const result2 = resolveRecommendationConflicts([
        candidates[2],
        candidates[0],
        candidates[1],
      ])

      expect(result1.recommendations.map((r) => r.id)).toEqual(
        result2.recommendations.map((r) => r.id),
      )
      expect(result1.recommendations.map((r) => r.rank)).toEqual([1, 2, 3])
      expect(result2.recommendations.map((r) => r.rank)).toEqual([1, 2, 3])
    })
  })
})
