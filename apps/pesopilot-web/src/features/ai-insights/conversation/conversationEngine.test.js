import { describe, expect, it } from 'vitest'
import {
  conversationEngine,
} from './conversationEngine.js'
import {
  closeSession,
  createSession,
  isValidTimestamp,
  SESSION_STATUSES,
} from './conversationSession.js'
import {
  createMessage,
  MAX_MESSAGE_CHARACTERS,
  MESSAGE_ROLES,
} from './conversationMessage.js'
import {
  CONVERSATION_TOPICS,
  createTopicState,
  updateTopicState,
} from './topicTracker.js'
import {
  CLARIFICATION_REASONS,
  createClarificationState,
  requestClarificationState,
  resolveClarificationState,
} from './clarificationManager.js'
import {
  CONVERSATION_VERSION,
  createConversation,
  startConversation,
  appendConversationMessage,
  updateConversationTopic,
  requestConversationClarification,
  resolveConversationClarification,
  closeConversation,
} from './conversation.js'
import {
  buildConversationContext,
  CONVERSATION_CONTEXT_VERSION,
  MAX_RECENT_MESSAGES,
} from './conversationContextBuilder.js'
import {
  validateConversation,
  validateConversationContext,
  validateMessage,
  validateSession,
  validateTopicState,
  validateClarificationState,
} from './conversationValidator.js'

describe('Phase 11B.2 — Conversation Engine', () => {
  const T0 = '2026-10-04T12:00:00.000Z'
  const T1 = '2026-10-04T12:01:00.000Z'
  const T2 = '2026-10-04T12:02:00.000Z'
  const T3 = '2026-10-04T12:03:00.000Z'

  describe('Timestamp Validator', () => {
    it('validates ISO-8601 UTC timestamps and rejects malformed values', () => {
      expect(isValidTimestamp(T0)).toBe(true)
      expect(isValidTimestamp('2026-10-04T12:00:00Z')).toBe(true)
      expect(isValidTimestamp('')).toBe(false)
      expect(isValidTimestamp(null)).toBe(false)
      expect(isValidTimestamp(undefined)).toBe(false)
      expect(isValidTimestamp('not-a-date')).toBe(false)
      expect(isValidTimestamp('2026-10-04')).toBe(false) // missing T separator
    })
  })

  describe('Session Model', () => {
    it('creates a valid active session with caller-supplied startedAt', () => {
      const session = createSession({ startedAt: T0 })
      expect(session.status).toBe(SESSION_STATUSES.active)
      expect(session.startedAt).toBe(T0)
      expect(session.endedAt).toBeNull()
      expect(Object.isFrozen(session)).toBe(true)
    })

    it('creates a valid closed session with caller-supplied startedAt and endedAt', () => {
      const session = createSession({
        endedAt: T1,
        startedAt: T0,
        status: SESSION_STATUSES.closed,
      })
      expect(session.status).toBe(SESSION_STATUSES.closed)
      expect(session.startedAt).toBe(T0)
      expect(session.endedAt).toBe(T1)
    })

    it('rejects active session with non-null endedAt', () => {
      expect(() => {
        createSession({
          endedAt: T1,
          startedAt: T0,
          status: SESSION_STATUSES.active,
        })
      }).toThrow('Active session cannot have endedAt set.')
    })

    it('rejects closed session with null or missing endedAt', () => {
      expect(() => {
        createSession({
          endedAt: null,
          startedAt: T0,
          status: SESSION_STATUSES.closed,
        })
      }).toThrow('Closed session requires a caller-supplied endedAt timestamp.')
    })

    it('rejects invalid session status or missing startedAt', () => {
      expect(() => {
        createSession({ startedAt: T0, status: 'paused' })
      }).toThrow(/Invalid session status "paused"/)

      expect(() => {
        createSession({ startedAt: '' })
      }).toThrow('createSession requires a caller-supplied startedAt timestamp.')

      expect(() => {
        createSession({ startedAt: 'invalid' })
      }).toThrow('createSession requires a valid ISO-8601 startedAt timestamp.')
    })

    it('closes an active session immutably and rejects double closing', () => {
      const active = createSession({ startedAt: T0 })
      const closed = closeSession(active, { endedAt: T1 })

      expect(active.status).toBe(SESSION_STATUSES.active)
      expect(closed.status).toBe(SESSION_STATUSES.closed)
      expect(closed.startedAt).toBe(T0)
      expect(closed.endedAt).toBe(T1)

      expect(() => {
        closeSession(closed, { endedAt: T2 })
      }).toThrow('Session is already closed.')
    })
  })

  describe('Message Model', () => {
    it('creates valid user and assistant messages preserving original untrimmed content', () => {
      const content = '  Hello, what is my net cashflow?  '
      const msg = createMessage({
        content,
        createdAt: T0,
        messageId: 'msg-1',
        role: MESSAGE_ROLES.user,
        sequence: 1,
      })

      expect(msg.messageId).toBe('msg-1')
      expect(msg.role).toBe('user')
      expect(msg.content).toBe(content) // Preserved exactly, untrimmed
      expect(msg.createdAt).toBe(T0)
      expect(msg.sequence).toBe(1)
      expect(Object.isFrozen(msg)).toBe(true)
    })

    it('creates valid assistant message', () => {
      const msg = createMessage({
        content: 'Your net cashflow is positive.',
        createdAt: T1,
        messageId: 'msg-2',
        role: MESSAGE_ROLES.assistant,
        sequence: 2,
      })
      expect(msg.role).toBe('assistant')
    })

    it('strictly rejects system, developer, tool, or function roles', () => {
      const invalidRoles = ['system', 'developer', 'tool', 'function', 'bot']
      invalidRoles.forEach((role) => {
        expect(() => {
          createMessage({
            content: 'sys instruction',
            createdAt: T0,
            messageId: 'msg-sys',
            role,
            sequence: 1,
          })
        }).toThrow(/Invalid message role/)
      })
    })

    it('rejects empty or whitespace-only message content', () => {
      expect(() => {
        createMessage({
          content: '',
          createdAt: T0,
          messageId: 'msg-1',
          role: MESSAGE_ROLES.user,
          sequence: 1,
        })
      }).toThrow('createMessage requires non-empty text content.')

      expect(() => {
        createMessage({
          content: '   \n\t  ',
          createdAt: T0,
          messageId: 'msg-1',
          role: MESSAGE_ROLES.user,
          sequence: 1,
        })
      }).toThrow('createMessage requires non-empty text content.')
    })

    it('rejects content exceeding MAX_MESSAGE_CHARACTERS (4000) without silent truncation', () => {
      const oversized = 'a'.repeat(MAX_MESSAGE_CHARACTERS + 1)
      expect(() => {
        createMessage({
          content: oversized,
          createdAt: T0,
          messageId: 'msg-big',
          role: MESSAGE_ROLES.user,
          sequence: 1,
        })
      }).toThrow(/Message content exceeds maximum allowed length of 4000 characters/)

      const atLimit = 'a'.repeat(MAX_MESSAGE_CHARACTERS)
      const validMsg = createMessage({
        content: atLimit,
        createdAt: T0,
        messageId: 'msg-limit',
        role: MESSAGE_ROLES.user,
        sequence: 1,
      })
      expect(validMsg.content.length).toBe(4000)
    })

    it('rejects missing messageId, missing createdAt, and invalid sequence', () => {
      expect(() => {
        createMessage({
          content: 'test',
          createdAt: T0,
          messageId: '',
          role: MESSAGE_ROLES.user,
          sequence: 1,
        })
      }).toThrow('createMessage requires a non-empty messageId string.')

      expect(() => {
        createMessage({
          content: 'test',
          createdAt: 'invalid-time',
          messageId: 'msg-1',
          role: MESSAGE_ROLES.user,
          sequence: 1,
        })
      }).toThrow('createMessage requires a valid ISO-8601 createdAt timestamp.')

      expect(() => {
        createMessage({
          content: 'test',
          createdAt: T0,
          messageId: 'msg-1',
          role: MESSAGE_ROLES.user,
          sequence: 0,
        })
      }).toThrow('createMessage requires a positive integer sequence number.')
    })
  })

  describe('Topic Tracker', () => {
    it('accepts all 10 allowed canonical topics', () => {
      const allowed = Object.values(CONVERSATION_TOPICS)
      expect(allowed).toHaveLength(10)
      allowed.forEach((topic) => {
        const state = createTopicState({ current: topic, updatedAt: T0 })
        expect(state.current).toBe(topic)
        expect(state.previous).toBeNull()
        expect(state.updatedAt).toBe(T0)
        expect(Object.isFrozen(state)).toBe(true)
      })
    })

    it('rejects unknown topic and arbitrary unlisted topic strings', () => {
      expect(() => {
        createTopicState({ current: 'unknown', updatedAt: T0 })
      }).toThrow(/Invalid topic "unknown"/)

      expect(() => {
        createTopicState({ current: 'investments', updatedAt: T0 })
      }).toThrow(/Invalid topic "investments"/)
    })

    it('transitions topics deterministically with previous tracking', () => {
      const state1 = createTopicState({ current: CONVERSATION_TOPICS.general, updatedAt: T0 })
      const state2 = updateTopicState(state1, { newTopic: CONVERSATION_TOPICS.expenses, updatedAt: T1 })

      expect(state2.current).toBe(CONVERSATION_TOPICS.expenses)
      expect(state2.previous).toBe(CONVERSATION_TOPICS.general)
      expect(state2.updatedAt).toBe(T1)
      expect(state1.current).toBe(CONVERSATION_TOPICS.general) // state1 unmodified
    })
  })

  describe('Clarification Manager', () => {
    it('creates canonical inactive clarification state', () => {
      const state = createClarificationState({ required: false })
      expect(state.required).toBe(false)
      expect(state.reason).toBeNull()
      expect(state.missingFields).toEqual([])
      expect(Object.isFrozen(state)).toBe(true)
      expect(Object.isFrozen(state.missingFields)).toBe(true)
    })

    it('rejects inactive clarification with non-null reason or non-empty missingFields (no silent repair)', () => {
      expect(() => {
        createClarificationState({
          missingFields: [],
          reason: CLARIFICATION_REASONS.ambiguousIntent,
          required: false,
        })
      }).toThrow('ClarificationState cannot have a reason when required is false.')

      expect(() => {
        createClarificationState({
          missingFields: ['topic'],
          reason: null,
          required: false,
        })
      }).toThrow('ClarificationState cannot have missingFields when required is false.')
    })

    it('creates active clarification state with allowed reason and missing fields', () => {
      const state = requestClarificationState({
        missingFields: ['cutoff', 'expenses'],
        reason: CLARIFICATION_REASONS.missingFinancialContext,
      })
      expect(state.required).toBe(true)
      expect(state.reason).toBe(CLARIFICATION_REASONS.missingFinancialContext)
      expect(state.missingFields).toEqual(['cutoff', 'expenses'])
      expect(Object.isFrozen(state)).toBe(true)
    })

    it('rejects active clarification with missing or unregistered reason', () => {
      expect(() => {
        createClarificationState({
          missingFields: [],
          reason: null,
          required: true,
        })
      }).toThrow(/Invalid clarification reason/)

      expect(() => {
        createClarificationState({
          missingFields: [],
          reason: 'unregistered_reason',
          required: true,
        })
      }).toThrow(/Invalid clarification reason/)
    })

    it('resolves clarification back to canonical inactive state', () => {
      const resolved = resolveClarificationState()
      expect(resolved.required).toBe(false)
      expect(resolved.reason).toBeNull()
      expect(resolved.missingFields).toEqual([])
    })
  })

  describe('Conversation Aggregate and Lifecycle Operations', () => {
    it('startConversation initializes canonical aggregate using caller timestamp consistently', () => {
      const conv = startConversation({
        conversationId: 'conv-101',
        createdAt: T0,
        topic: CONVERSATION_TOPICS.health,
      })

      expect(conv.version).toBe(CONVERSATION_VERSION)
      expect(conv.conversationId).toBe('conv-101')
      expect(conv.createdAt).toBe(T0)
      expect(conv.updatedAt).toBe(T0)
      expect(conv.messages).toEqual([])

      expect(conv.session.status).toBe(SESSION_STATUSES.active)
      expect(conv.session.startedAt).toBe(T0)
      expect(conv.session.endedAt).toBeNull()

      expect(conv.topicState.current).toBe(CONVERSATION_TOPICS.health)
      expect(conv.topicState.previous).toBeNull()
      expect(conv.topicState.updatedAt).toBe(T0)

      expect(conv.clarificationState.required).toBe(false)
      expect(conv.clarificationState.reason).toBeNull()
      expect(conv.clarificationState.missingFields).toEqual([])

      expect(Object.isFrozen(conv)).toBe(true)
      expect(Object.isFrozen(conv.messages)).toBe(true)
    })

    it('appendMessage derives sequence deterministically, preserves chronology, and updates updatedAt', () => {
      const conv0 = startConversation({
        conversationId: 'conv-101',
        createdAt: T0,
      })

      const conv1 = appendConversationMessage(conv0, {
        content: 'Why did my savings drop?',
        createdAt: T1,
        messageId: 'm-1',
        role: MESSAGE_ROLES.user,
      })

      expect(conv1.messages).toHaveLength(1)
      expect(conv1.messages[0].sequence).toBe(1)
      expect(conv1.messages[0].messageId).toBe('m-1')
      expect(conv1.updatedAt).toBe(T1)
      expect(conv0.messages).toHaveLength(0) // immutability

      const conv2 = appendConversationMessage(conv1, {
        content: 'Your contributions decreased this period.',
        createdAt: T2,
        messageId: 'm-2',
        role: MESSAGE_ROLES.assistant,
      })

      expect(conv2.messages).toHaveLength(2)
      expect(conv2.messages[1].sequence).toBe(2)
      expect(conv2.messages[1].messageId).toBe('m-2')
      expect(conv2.updatedAt).toBe(T2)
    })

    it('appendMessage rejects duplicate message IDs', () => {
      const conv0 = startConversation({ conversationId: 'conv-101', createdAt: T0 })
      const conv1 = appendConversationMessage(conv0, {
        content: 'Message 1',
        createdAt: T1,
        messageId: 'dup-id',
        role: MESSAGE_ROLES.user,
      })

      expect(() => {
        appendConversationMessage(conv1, {
          content: 'Message 2 with same ID',
          createdAt: T2,
          messageId: 'dup-id',
          role: MESSAGE_ROLES.assistant,
        })
      }).toThrow('Duplicate messageId "dup-id" in conversation messages.')
    })

    it('appendMessage rejects appending to closed conversation', () => {
      const conv0 = startConversation({ conversationId: 'conv-101', createdAt: T0 })
      const closed = closeConversation(conv0, { endedAt: T1 })

      expect(() => {
        appendConversationMessage(closed, {
          content: 'Should fail',
          createdAt: T2,
          messageId: 'm-fail',
          role: MESSAGE_ROLES.user,
        })
      }).toThrow('Cannot append message to a closed conversation.')
    })

    it('updateTopic updates topic and updatedAt immutably, and rejects closed conversation', () => {
      const conv0 = startConversation({ conversationId: 'conv-101', createdAt: T0 })
      const conv1 = updateConversationTopic(conv0, {
        topic: CONVERSATION_TOPICS.expenses,
        updatedAt: T1,
      })

      expect(conv1.topicState.current).toBe(CONVERSATION_TOPICS.expenses)
      expect(conv1.topicState.previous).toBe(CONVERSATION_TOPICS.general)
      expect(conv1.topicState.updatedAt).toBe(T1)
      expect(conv1.updatedAt).toBe(T1)

      const closed = closeConversation(conv1, { endedAt: T2 })
      expect(() => {
        updateConversationTopic(closed, {
          topic: CONVERSATION_TOPICS.goals,
          updatedAt: T3,
        })
      }).toThrow('Cannot update topic of a closed conversation.')
    })

    it('requestClarification and resolveClarification update clarification state immutably', () => {
      const conv0 = startConversation({ conversationId: 'conv-101', createdAt: T0 })

      const conv1 = requestConversationClarification(conv0, {
        missingFields: ['income'],
        reason: CLARIFICATION_REASONS.missingFinancialContext,
        updatedAt: T1,
      })
      expect(conv1.clarificationState.required).toBe(true)
      expect(conv1.clarificationState.reason).toBe(CLARIFICATION_REASONS.missingFinancialContext)
      expect(conv1.clarificationState.missingFields).toEqual(['income'])
      expect(conv1.updatedAt).toBe(T1)

      const conv2 = resolveConversationClarification(conv1, { updatedAt: T2 })
      expect(conv2.clarificationState.required).toBe(false)
      expect(conv2.clarificationState.reason).toBeNull()
      expect(conv2.clarificationState.missingFields).toEqual([])
      expect(conv2.updatedAt).toBe(T2)
    })

    it('closeConversation closes session and sets endedAt and updatedAt', () => {
      const conv0 = startConversation({ conversationId: 'conv-101', createdAt: T0 })
      const closed = closeConversation(conv0, { endedAt: T1 })

      expect(closed.session.status).toBe(SESSION_STATUSES.closed)
      expect(closed.session.startedAt).toBe(T0)
      expect(closed.session.endedAt).toBe(T1)
      expect(closed.updatedAt).toBe(T1)

      expect(() => {
        closeConversation(closed, { endedAt: T2 })
      }).toThrow('Conversation is already closed.')
    })
  })

  describe('Conversation Context Builder', () => {
    it('builds minimized canonical ConversationContext conforming to 1.0.0 and strips internal metadata', () => {
      let conv = startConversation({
        conversationId: 'conv-internal-id',
        createdAt: T0,
        topic: CONVERSATION_TOPICS.savings,
      })
      conv = appendConversationMessage(conv, {
        content: 'How are my savings goals?',
        createdAt: T1,
        messageId: 'msg-001',
        role: MESSAGE_ROLES.user,
      })
      conv = appendConversationMessage(conv, {
        content: 'You have funded 65% of your emergency fund.',
        createdAt: T2,
        messageId: 'msg-002',
        role: MESSAGE_ROLES.assistant,
      })

      const ctx = buildConversationContext({ conversation: conv })

      expect(ctx.version).toBe(CONVERSATION_CONTEXT_VERSION)
      expect(ctx.topic).toEqual({ current: 'savings' })
      expect(ctx.clarification).toEqual({ required: false, reason: null, missingFields: [] })
      expect(ctx.recentMessages).toHaveLength(2)
      expect(ctx.recentMessages[0]).toEqual({
        content: 'How are my savings goals?',
        role: 'user',
      })
      expect(ctx.recentMessages[1]).toEqual({
        content: 'You have funded 65% of your emergency fund.',
        role: 'assistant',
      })

      // Excluded internal fields
      expect(ctx.conversationId).toBeUndefined()
      expect(ctx.session).toBeUndefined()
      expect(ctx.createdAt).toBeUndefined()
      expect(ctx.updatedAt).toBeUndefined()
      expect(ctx.topic.previous).toBeUndefined()
      expect(ctx.topic.updatedAt).toBeUndefined()
      expect(ctx.recentMessages[0].messageId).toBeUndefined()
      expect(ctx.recentMessages[0].createdAt).toBeUndefined()
      expect(ctx.recentMessages[0].sequence).toBeUndefined()

      // Frozen
      expect(Object.isFrozen(ctx)).toBe(true)
      expect(Object.isFrozen(ctx.topic)).toBe(true)
      expect(Object.isFrozen(ctx.clarification)).toBe(true)
      expect(Object.isFrozen(ctx.recentMessages)).toBe(true)
    })

    it('bounds message history to exactly the last 10 messages preserving chronological order', () => {
      let conv = startConversation({ conversationId: 'conv-many', createdAt: T0 })
      for (let i = 1; i <= 14; i++) {
        conv = appendConversationMessage(conv, {
          content: `Message ${i}`,
          createdAt: `2026-10-04T12:${i < 10 ? '0' + i : i}:00.000Z`,
          messageId: `msg-${i}`,
          role: i % 2 === 1 ? MESSAGE_ROLES.user : MESSAGE_ROLES.assistant,
        })
      }

      expect(conv.messages).toHaveLength(14)
      const ctx = buildConversationContext({ conversation: conv })

      // Strictly capped at MAX_RECENT_MESSAGES = 10
      expect(ctx.recentMessages).toHaveLength(MAX_RECENT_MESSAGES)
      expect(ctx.recentMessages[0].content).toBe('Message 5')
      expect(ctx.recentMessages[9].content).toBe('Message 14')
    })
  })

  describe('Pure Validators', () => {
    it('validates conforming Conversation and returns { valid: true, errors: [] }', () => {
      const conv = startConversation({ conversationId: 'conv-valid', createdAt: T0 })
      const res = validateConversation(conv)
      expect(res.valid).toBe(true)
      expect(res.errors).toEqual([])
    })

    it('validates conforming ConversationContext and returns { valid: true, errors: [] }', () => {
      const conv = startConversation({ conversationId: 'conv-valid', createdAt: T0 })
      const ctx = buildConversationContext({ conversation: conv })
      const res = validateConversationContext(ctx)
      expect(res.valid).toBe(true)
      expect(res.errors).toEqual([])
    })

    it('detects broken message sequence and duplicate IDs during Conversation validation', () => {
      const invalidConv = {
        clarificationState: { missingFields: [], reason: null, required: false },
        conversationId: 'conv-bad',
        createdAt: T0,
        messages: [
          { content: '1', createdAt: T0, messageId: 'm-1', role: 'user', sequence: 1 },
          { content: '2', createdAt: T1, messageId: 'm-1', role: 'assistant', sequence: 3 }, // duplicate ID & gap in sequence
        ],
        session: { endedAt: null, startedAt: T0, status: 'active' },
        topicState: { current: 'general', previous: null, updatedAt: T0 },
        updatedAt: T1,
        version: '1.0.0',
      }

      const res = validateConversation(invalidConv)
      expect(res.valid).toBe(false)
      expect(res.errors.some((e) => e.includes('Duplicate messageId "m-1"'))).toBe(true)
      expect(res.errors.some((e) => e.includes('Message sequence out of order'))).toBe(true)
    })

    it('rejects ConversationContext exceeding 10 messages or having invalid message roles', () => {
      const oversizedCtx = {
        clarification: { missingFields: [], reason: null, required: false },
        recentMessages: Array.from({ length: 11 }, (_, i) => ({
          content: `Msg ${i}`,
          role: 'user',
        })),
        topic: { current: 'general' },
        version: '1.0.0',
      }
      const res1 = validateConversationContext(oversizedCtx)
      expect(res1.valid).toBe(false)
      expect(res1.errors.some((e) => e.includes('exceeds max length of 10'))).toBe(true)

      const badRoleCtx = {
        clarification: { missingFields: [], reason: null, required: false },
        recentMessages: [{ content: 'Instruction', role: 'system' }],
        topic: { current: 'general' },
        version: '1.0.0',
      }
      const res2 = validateConversationContext(badRoleCtx)
      expect(res2.valid).toBe(false)
      expect(res2.errors.some((e) => e.includes('invalid role "system"'))).toBe(true)
    })

    it('directly exercises pure validators and createConversation factory', () => {
      const validSession = createSession({ startedAt: T0 })
      expect(validateSession(validSession).valid).toBe(true)
      expect(validateSession({ status: 'invalid' }).valid).toBe(false)

      const validMsg = createMessage({
        content: 'Valid content',
        createdAt: T0,
        messageId: 'm-direct',
        role: MESSAGE_ROLES.user,
        sequence: 1,
      })
      expect(validateMessage(validMsg).valid).toBe(true)
      expect(validateMessage({ role: 'system' }).valid).toBe(false)

      const validTopic = createTopicState({ current: CONVERSATION_TOPICS.general, updatedAt: T0 })
      expect(validateTopicState(validTopic).valid).toBe(true)
      expect(validateTopicState({ current: 'unregistered' }).valid).toBe(false)

      const validClar = createClarificationState({ required: false })
      expect(validateClarificationState(validClar).valid).toBe(true)
      expect(validateClarificationState({ required: 'not-bool' }).valid).toBe(false)

      const directConv = createConversation({
        clarificationState: validClar,
        conversationId: 'direct-conv',
        createdAt: T0,
        messages: [validMsg],
        session: validSession,
        topicState: validTopic,
        updatedAt: T0,
      })
      expect(directConv.conversationId).toBe('direct-conv')
      expect(validateConversation(directConv).valid).toBe(true)
    })
  })

  describe('conversationEngine Public Facade', () => {
    it('exposes approved lifecycle methods and ready status with no operational execution methods', () => {
      expect(conversationEngine.name).toBe('conversation-engine')
      expect(conversationEngine.status).toBe('ready')
      expect(Object.isFrozen(conversationEngine)).toBe(true)

      const expectedMethods = [
        'startConversation',
        'appendMessage',
        'updateTopic',
        'requestClarification',
        'resolveClarification',
        'closeConversation',
        'buildConversationContext',
        'validateConversation',
        'validateConversationContext',
      ]
      expectedMethods.forEach((fn) => {
        expect(typeof conversationEngine[fn]).toBe('function')
      })

      const prohibited = ['execute', 'chat', 'generate', 'complete', 'send', 'invoke', 'stream']
      prohibited.forEach((m) => {
        expect(conversationEngine[m]).toBeUndefined()
      })
    })

    it('executes full conversation turn flow through the public engine facade', () => {
      // 1. Start
      let conv = conversationEngine.startConversation({
        conversationId: 'turn-flow',
        createdAt: T0,
        topic: CONVERSATION_TOPICS.health,
      })
      expect(conv.topicState.current).toBe('health')

      // 2. Append User Message
      conv = conversationEngine.appendMessage(conv, {
        content: 'Is my financial health good?',
        createdAt: T1,
        messageId: 'turn-msg-1',
        role: MESSAGE_ROLES.user,
      })

      // 3. Request Clarification (e.g. missing cutoff)
      conv = conversationEngine.requestClarification(conv, {
        missingFields: ['cutoff'],
        reason: CLARIFICATION_REASONS.missingFinancialContext,
        updatedAt: T2,
      })
      expect(conv.clarificationState.required).toBe(true)

      // 4. Resolve Clarification
      conv = conversationEngine.resolveClarification(conv, { updatedAt: T2 })
      expect(conv.clarificationState.required).toBe(false)

      // 5. Append Assistant Response
      conv = conversationEngine.appendMessage(conv, {
        content: 'Your health score is strong at 85/100.',
        createdAt: T2,
        messageId: 'turn-msg-2',
        role: MESSAGE_ROLES.assistant,
      })

      // 6. Build Context for Prompt Package
      const context = conversationEngine.buildConversationContext({ conversation: conv })
      const validation = conversationEngine.validateConversationContext(context)
      expect(validation.valid).toBe(true)
      expect(context.recentMessages).toHaveLength(2)

      // 7. Close
      conv = conversationEngine.closeConversation(conv, { endedAt: T3 })
      expect(conv.session.status).toBe('closed')
    })
  })
})
