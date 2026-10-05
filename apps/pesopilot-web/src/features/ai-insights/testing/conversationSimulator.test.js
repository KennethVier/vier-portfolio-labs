import { describe, expect, it } from 'vitest'
import { createConversationSimulator } from './conversationSimulator.js'

describe('Phase 11B.9 — Conversation Simulator', () => {
  it('drives real Conversation Engine to manage multi-turn messages and produce valid context', () => {
    const sim = createConversationSimulator()

    sim.applyTurn({ role: 'user', content: 'What is my savings rate?' })
    sim.applyTurn({ role: 'assistant', content: 'Your current savings rate is 10%.' })

    const conversation = sim.getConversation()
    expect(conversation.messages.length).toBe(2)
    expect(conversation.messages[0].role).toBe('user')
    expect(conversation.messages[1].role).toBe('assistant')

    const context = sim.getContext()
    expect(context.version).toBe('1.0.0')
    expect(context.recentMessages.length).toBe(2)
    expect(context.topic.current).toBe('general')

    const validation = sim.validate()
    expect(validation.valid).toBe(true)
  })

  it('updates topic and executes clarification lifecycle using real Conversation Engine', () => {
    const sim = createConversationSimulator({ topic: 'general' })

    sim.updateTopic('savings')
    expect(sim.getConversation().topicState.current).toBe('savings')

    sim.requestClarification({
      reason: 'missing_financial_context',
      missingFields: ['currentCutoff'],
    })
    expect(sim.getContext().clarification.required).toBe(true)
    expect(sim.getContext().clarification.reason).toBe('missing_financial_context')
    expect(sim.getContext().clarification.missingFields).toEqual(['currentCutoff'])

    sim.resolveClarification()
    expect(sim.getContext().clarification.required).toBe(false)
  })

  it('enforces real recent-message boundary (max 10 recent messages in context)', () => {
    const sim = createConversationSimulator()

    for (let i = 1; i <= 15; i++) {
      sim.applyTurn({ role: i % 2 === 1 ? 'user' : 'assistant', content: `Message ${i}` })
    }

    const conversation = sim.getConversation()
    expect(conversation.messages.length).toBe(15)

    const context = sim.getContext()
    expect(context.recentMessages.length).toBe(10) // Exactly bounded to 10 by real context builder!
    expect(context.recentMessages[0].content).toBe('Message 6')
    expect(context.recentMessages[9].content).toBe('Message 15')
  })

  it('applies scripted operation list and rejects invalid roles via real validation', () => {
    const sim = createConversationSimulator()

    const script = [
      { op: 'message', role: 'user', content: 'Start of session' },
      { op: 'topic', topic: 'expenses' },
      { op: 'message', role: 'assistant', content: 'Expense tracking ready' },
    ]

    const scriptSnapshot = JSON.stringify(script)
    sim.applyScript(script)

    expect(JSON.stringify(script)).toBe(scriptSnapshot)
    expect(sim.getConversation().messages.length).toBe(2)
    expect(sim.getContext().topic.current).toBe('expenses')

    expect(() => {
      sim.applyTurn({ role: 'invalid_role', content: 'Testing failure' })
    }).toThrow()
  })
})
