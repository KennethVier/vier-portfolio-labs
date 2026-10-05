import { describe, expect, it } from 'vitest'

import {
  ALERT_STATUS,
  RISK_LEVELS,
  RISK_SIGNAL_CODES,
} from '../constants/budgetShockConstants.js'
import {
  budgetShockAlertService,
  buildAlertMessage,
} from './budgetShockAlertService.js'

function createMockRepository(initial = []) {
  let records = [...initial]
  let autoId = initial.length + 1

  return {
    async create(data) {
      const record = { id: autoId++, ...data }
      records.push(record)
      return record
    },
    async findByCutoff(cutoffId) {
      return records.filter((r) => r.cutoffId === cutoffId)
    },
    async findAll() {
      return [...records]
    },
    async update(id, updates) {
      const index = records.findIndex((r) => r.id === id)
      if (index !== -1) {
        records[index] = { ...records[index], ...updates }
        return records[index]
      }
      return null
    },
    _getRecords() {
      return records
    },
  }
}

describe('budgetShockAlertService', () => {
  const mockNow = '2026-06-20T10:00:00.000Z'

  describe('buildAlertMessage', () => {
    it('returns empty string for null risk result', () => {
      expect(buildAlertMessage(null)).toBe('')
    })

    it('returns deterministic message for category over budget', () => {
      expect(
        buildAlertMessage({
          level: RISK_LEVELS.red,
          primaryReasonCode: RISK_SIGNAL_CODES.CATEGORY_OVER_BUDGET,
        }),
      ).toBe('Category spending has exceeded its planned budget for this cutoff.')
    })
  })

  describe('Alert Generation & Invariants', () => {
    it('does NOT create persistent alert for Green', async () => {
      const repo = createMockRepository()
      const risk = { cutoffId: 10, level: RISK_LEVELS.green }

      const result = await budgetShockAlertService.synchronizeAlert({
        riskResult: risk,
        repository: repo,
        now: mockNow,
      })

      expect(result).toBeNull()
      expect(repo._getRecords()).toHaveLength(0)
    })

    it('does NOT create persistent alert for Yellow', async () => {
      const repo = createMockRepository()
      const risk = {
        cutoffId: 10,
        level: RISK_LEVELS.yellow,
        primaryReasonCode: RISK_SIGNAL_CODES.BURN_NEAR_SAFE,
      }

      const result = await budgetShockAlertService.synchronizeAlert({
        riskResult: risk,
        repository: repo,
        now: mockNow,
      })

      expect(result).toBeNull()
      expect(repo._getRecords()).toHaveLength(0)
    })

    it('creates active alert when risk is Orange', async () => {
      const repo = createMockRepository()
      const risk = {
        cutoffId: 10,
        level: RISK_LEVELS.orange,
        primaryReasonCode: RISK_SIGNAL_CODES.BURN_EXCEEDS_SAFE,
        causeCategoryId: null,
        projectedDeficit: 0,
      }
      const rec = {
        recommendedAction: 'Keep discretionary spending at safe limit.',
      }

      const alert = await budgetShockAlertService.synchronizeAlert({
        riskResult: risk,
        recommendation: rec,
        repository: repo,
        now: mockNow,
      })

      expect(alert).not.toBeNull()
      expect(alert.cutoffId).toBe(10)
      expect(alert.level).toBe(RISK_LEVELS.orange)
      expect(alert.status).toBe(ALERT_STATUS.active)
      expect(alert.createdAt).toBe(mockNow)
      expect(alert.resolvedAt).toBeNull()
      expect(alert.message).toContain('burn rate is above the safe daily spend')
      expect(alert.recommendedAction).toBe('Keep discretionary spending at safe limit.')

      // Check exact schema fields only
      const keys = Object.keys(alert).sort()
      expect(keys).toEqual([
        'causeCategoryId',
        'createdAt',
        'cutoffId',
        'id',
        'level',
        'message',
        'projectedDeficit',
        'recommendedAction',
        'resolvedAt',
        'status',
      ])
    })

    it('creates active alert when risk is Red', async () => {
      const repo = createMockRepository()
      const risk = {
        cutoffId: 10,
        level: RISK_LEVELS.red,
        primaryReasonCode: RISK_SIGNAL_CODES.PROJECTED_DEFICIT,
        causeCategoryId: null,
        projectedDeficit: 1500,
      }
      const rec = {
        recommendedAction: 'Reduce spending to address shortfall.',
      }

      const alert = await budgetShockAlertService.synchronizeAlert({
        riskResult: risk,
        recommendation: rec,
        repository: repo,
        now: mockNow,
      })

      expect(alert.level).toBe(RISK_LEVELS.red)
      expect(alert.projectedDeficit).toBe(1500)
      expect(alert.message).toContain('shortfall of ₱1,500.00')
    })
  })

  describe('Alert Lifecycle & Deduplication', () => {
    it('Orange -> Red in same cutoff updates existing active alert without duplicate insertion', async () => {
      const repo = createMockRepository()
      const riskOrange = {
        cutoffId: 10,
        level: RISK_LEVELS.orange,
        primaryReasonCode: RISK_SIGNAL_CODES.BURN_EXCEEDS_SAFE,
      }

      await budgetShockAlertService.synchronizeAlert({
        riskResult: riskOrange,
        repository: repo,
        now: mockNow,
      })

      expect(repo._getRecords()).toHaveLength(1)
      expect(repo._getRecords()[0].level).toBe(RISK_LEVELS.orange)

      // Next evaluation escalates to Red
      const riskRed = {
        cutoffId: 10,
        level: RISK_LEVELS.red,
        primaryReasonCode: RISK_SIGNAL_CODES.PROJECTED_DEFICIT,
        projectedDeficit: 800,
      }

      const updated = await budgetShockAlertService.synchronizeAlert({
        riskResult: riskRed,
        repository: repo,
        now: '2026-06-20T12:00:00.000Z',
      })

      expect(repo._getRecords()).toHaveLength(1) // Still exactly 1 row!
      expect(updated.level).toBe(RISK_LEVELS.red)
      expect(updated.status).toBe(ALERT_STATUS.active)
      expect(updated.projectedDeficit).toBe(800)
    })

    it('Red -> Orange in same cutoff updates existing active alert', async () => {
      const repo = createMockRepository([
        {
          id: 1,
          cutoffId: 10,
          level: RISK_LEVELS.red,
          status: ALERT_STATUS.active,
          createdAt: mockNow,
          resolvedAt: null,
        },
      ])

      const riskOrange = {
        cutoffId: 10,
        level: RISK_LEVELS.orange,
        primaryReasonCode: RISK_SIGNAL_CODES.BURN_EXCEEDS_SAFE,
      }

      const updated = await budgetShockAlertService.synchronizeAlert({
        riskResult: riskOrange,
        repository: repo,
        now: '2026-06-20T14:00:00.000Z',
      })

      expect(repo._getRecords()).toHaveLength(1)
      expect(updated.level).toBe(RISK_LEVELS.orange)
      expect(updated.status).toBe(ALERT_STATUS.active)
    })

    it('Active Orange/Red -> Green marks alert resolved with timestamp', async () => {
      const repo = createMockRepository([
        {
          id: 1,
          cutoffId: 10,
          level: RISK_LEVELS.orange,
          status: ALERT_STATUS.active,
          createdAt: mockNow,
          resolvedAt: null,
        },
      ])

      const resolvedNow = '2026-06-21T09:00:00.000Z'
      const riskGreen = {
        cutoffId: 10,
        level: RISK_LEVELS.green,
      }

      const result = await budgetShockAlertService.synchronizeAlert({
        riskResult: riskGreen,
        repository: repo,
        now: resolvedNow,
      })

      expect(result).not.toBeNull()
      expect(result.status).toBe(ALERT_STATUS.resolved)
      expect(result.resolvedAt).toBe(resolvedNow)
      expect(repo._getRecords()[0].status).toBe(ALERT_STATUS.resolved)
    })

    it('Reactivation of resolved alert updates/reactivates record rather than creating uncontrolled duplicates', async () => {
      const repo = createMockRepository([
        {
          id: 1,
          cutoffId: 10,
          level: RISK_LEVELS.orange,
          status: ALERT_STATUS.resolved,
          createdAt: mockNow,
          resolvedAt: '2026-06-21T09:00:00.000Z',
        },
      ])

      const reactivatedRisk = {
        cutoffId: 10,
        level: RISK_LEVELS.red,
        primaryReasonCode: RISK_SIGNAL_CODES.PROJECTED_DEFICIT,
        projectedDeficit: 500,
      }

      const result = await budgetShockAlertService.synchronizeAlert({
        riskResult: reactivatedRisk,
        repository: repo,
        now: '2026-06-22T08:00:00.000Z',
      })

      expect(repo._getRecords()).toHaveLength(1)
      expect(result.status).toBe(ALERT_STATUS.active)
      expect(result.resolvedAt).toBeNull()
      expect(result.level).toBe(RISK_LEVELS.red)
      expect(result.createdAt).toBe(mockNow) // Original createdAt preserved
    })

    it('selects the most recent alert deterministically when multiple historical resolved alerts exist', async () => {
      const repo = createMockRepository([
        {
          id: 1,
          cutoffId: 10,
          level: RISK_LEVELS.orange,
          status: ALERT_STATUS.resolved,
          createdAt: '2026-06-15T09:00:00.000Z',
          resolvedAt: '2026-06-16T09:00:00.000Z',
        },
        {
          id: 2,
          cutoffId: 10,
          level: RISK_LEVELS.red,
          status: ALERT_STATUS.resolved,
          createdAt: '2026-06-18T09:00:00.000Z', // newer record
          resolvedAt: '2026-06-19T09:00:00.000Z',
        },
      ])

      const reactivatedRisk = {
        cutoffId: 10,
        level: RISK_LEVELS.orange,
        primaryReasonCode: RISK_SIGNAL_CODES.BURN_EXCEEDS_SAFE,
      }

      const result = await budgetShockAlertService.synchronizeAlert({
        riskResult: reactivatedRisk,
        repository: repo,
        now: '2026-06-20T09:00:00.000Z',
      })

      // Updates record id 2 (the newer record)
      expect(result.id).toBe(2)
      expect(result.status).toBe(ALERT_STATUS.active)
      expect(repo._getRecords()).toHaveLength(2) // No new row created
    })

    it('cleans up legacy duplicate active alerts on Orange/Red sync so exactly one active record remains', async () => {
      const repo = createMockRepository([
        {
          id: 1,
          cutoffId: 10,
          level: RISK_LEVELS.orange,
          status: ALERT_STATUS.active,
          createdAt: '2026-06-15T09:00:00.000Z',
          resolvedAt: null,
        },
        {
          id: 2,
          cutoffId: 10,
          level: RISK_LEVELS.red,
          status: ALERT_STATUS.active,
          createdAt: '2026-06-18T09:00:00.000Z', // canonical active alert (newer)
          resolvedAt: null,
        },
      ])

      const riskOrange = {
        cutoffId: 10,
        level: RISK_LEVELS.orange,
        primaryReasonCode: RISK_SIGNAL_CODES.BURN_EXCEEDS_SAFE,
      }

      await budgetShockAlertService.synchronizeAlert({
        riskResult: riskOrange,
        repository: repo,
        now: '2026-06-20T09:00:00.000Z',
      })

      const allRecords = repo._getRecords()
      const activeRecords = allRecords.filter((r) => r.status === ALERT_STATUS.active)
      expect(activeRecords).toHaveLength(1) // Exactly one active record!
      expect(activeRecords[0].id).toBe(2)

      const resolvedDuplicate = allRecords.find((r) => r.id === 1)
      expect(resolvedDuplicate.status).toBe(ALERT_STATUS.resolved)
      expect(resolvedDuplicate.resolvedAt).toBe('2026-06-20T09:00:00.000Z')
    })

    it('resolves ALL active records on Green/Yellow sync even if legacy duplicate active alerts existed', async () => {
      const repo = createMockRepository([
        {
          id: 1,
          cutoffId: 10,
          level: RISK_LEVELS.orange,
          status: ALERT_STATUS.active,
          createdAt: '2026-06-15T09:00:00.000Z',
          resolvedAt: null,
        },
        {
          id: 2,
          cutoffId: 10,
          level: RISK_LEVELS.red,
          status: ALERT_STATUS.active,
          createdAt: '2026-06-18T09:00:00.000Z',
          resolvedAt: null,
        },
      ])

      const riskGreen = {
        cutoffId: 10,
        level: RISK_LEVELS.green,
      }

      await budgetShockAlertService.synchronizeAlert({
        riskResult: riskGreen,
        repository: repo,
        now: '2026-06-20T09:00:00.000Z',
      })

      const allRecords = repo._getRecords()
      const activeRecords = allRecords.filter((r) => r.status === ALERT_STATUS.active)
      expect(activeRecords).toHaveLength(0) // Zero active records!
      expect(allRecords.every((r) => r.status === ALERT_STATUS.resolved)).toBe(true)
    })
  })
})
