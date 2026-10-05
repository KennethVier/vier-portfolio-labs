import { describe, expect, it } from 'vitest'
import { createMemorySimulator, MEMORY_TYPES, MEMORY_IMPORTANCES } from './memorySimulator.js'

describe('Phase 11B.9 — Memory Simulator', () => {
  it('drives real Memory Service to create, add, and validate memory records in memory', () => {
    const sim = createMemorySimulator()

    sim.addCandidate({
      candidate: {
        type: MEMORY_TYPES.communicationPreference,
        content: 'Prefers bulleted list summaries.',
        topics: ['general'],
        workflowTypes: ['financial-summary-explanation'],
        importance: MEMORY_IMPORTANCES.medium,
        source: { type: 'user' },
        explicitlyConfirmed: true,
      },
    })

    const state = sim.getState()
    expect(state.records.length).toBe(1)
    expect(state.records[0].type).toBe(MEMORY_TYPES.communicationPreference)
    expect(state.records[0].content).toBe('Prefers bulleted list summaries.')

    const validation = sim.validate()
    expect(validation.valid).toBe(true)
  })

  it('rejects candidate with unapproved memory type via real Memory Service', () => {
    const sim = createMemorySimulator()

    expect(() => {
      sim.addCandidate({
        candidate: {
          type: 'unapproved_financial_prediction',
          content: 'Secret account detail',
          topics: ['general'],
          workflowTypes: ['financial-summary-explanation'],
          importance: 'high',
          source: { type: 'user' },
          explicitlyConfirmed: true,
        },
      })
    }).toThrow()
  })

  it('retrieves and ranks prompt-facing memory context obeying real bounds', () => {
    const sim = createMemorySimulator()

    // Add 6 records (limit is max 5 items in DEFAULT_MEMORY_POLICY)
    for (let i = 1; i <= 6; i++) {
      sim.addCandidate({
        candidate: {
          type: MEMORY_TYPES.userPreference,
          content: `Preference note number ${i}`,
          topics: ['savings'],
          workflowTypes: ['financial-summary-explanation'],
          importance: i === 6 ? MEMORY_IMPORTANCES.high : MEMORY_IMPORTANCES.low,
          source: { type: 'user' },
          explicitlyConfirmed: true,
        },
      })
    }

    const context = sim.retrieve({ topic: 'savings', workflowType: 'financial-summary-explanation' })
    expect(context).not.toBeNull()
    expect(context.version).toBe('1.0.0')
    // Policy enforces maxRetrievedItems: 5
    expect(context.items.length).toBeLessThanOrEqual(5)
    // Most important item (high) ranked first
    expect(context.items[0].content).toBe('Preference note number 6')
  })

  it('preserves input record immutability', () => {
    const sim = createMemorySimulator()

    const candidate = {
      type: MEMORY_TYPES.coachingPreference,
      content: 'Wants conservative coaching advice.',
      topics: ['general'],
      workflowTypes: ['financial-summary-explanation'],
      importance: MEMORY_IMPORTANCES.medium,
      source: { type: 'user' },
      explicitlyConfirmed: true,
    }

    const snapshot = JSON.stringify(candidate)
    sim.addCandidate({ candidate })

    expect(JSON.stringify(candidate)).toBe(snapshot)
  })
})
