import { describe, expect, it } from 'vitest'
import {
  memoryService,
  createMemoryDto,
  createMemoryRecord,
  addMemoryRecord,
  evaluateCandidate,
  retrieveMemories,
  rankMemories,
  buildMemoryContext,
  retrieveContext,
  validateMemoryDto,
  validateMemoryContext,
  validateMemoryRecord,
  validateMemoryCandidate,
  getDefaultPolicy,
  DEFAULT_MEMORY_POLICY,
  MEMORY_DTO_VERSION,
  MEMORY_CONTEXT_VERSION,
  MEMORY_TYPES,
  MEMORY_IMPORTANCES,
  ALLOWED_WORKFLOW_TYPES,
} from './memoryService.js'
import { CONVERSATION_TOPICS } from '../conversation/topicTracker.js'

describe('Phase 11B.5 — Memory Service', () => {
  const sampleCandidate = Object.freeze({
    type: MEMORY_TYPES.communicationPreference,
    content: 'Prefers concise explanations.',
    topics: ['general'],
    workflowTypes: ['financial-summary-explanation'],
    explicitlyConfirmed: true,
    importance: MEMORY_IMPORTANCES.medium,
    source: Object.freeze({
      type: 'user',
      referenceId: null,
    }),
  })

  // 1. Candidate / Evaluator Tests
  describe('Memory Candidate / Evaluator', () => {
    it('accepts valid confirmed user preference candidate', () => {
      const result = evaluateCandidate(sampleCandidate)
      expect(result.eligible).toBe(true)
      expect(result.reasons).toEqual([])
    })

    it('rejects unconfirmed candidate', () => {
      const candidate = { ...sampleCandidate, explicitlyConfirmed: false }
      const result = evaluateCandidate(candidate)
      expect(result.eligible).toBe(false)
      expect(result.reasons).toContain('Candidate explicitlyConfirmed must be strictly true.')
    })

    it('rejects candidate with missing or non-boolean explicitlyConfirmed', () => {
      const candidate = { ...sampleCandidate, explicitlyConfirmed: undefined }
      const result = evaluateCandidate(candidate)
      expect(result.eligible).toBe(false)
    })

    it('rejects assistant source', () => {
      const candidate = {
        ...sampleCandidate,
        source: { type: 'assistant', referenceId: 'msg-1' },
      }
      const result = evaluateCandidate(candidate)
      expect(result.eligible).toBe(false)
      expect(result.reasons).toContain('Candidate source must be an object with type "user".')
    })

    it('rejects unknown memory type', () => {
      const candidate = {
        ...sampleCandidate,
        type: 'financial_fact',
      }
      const result = evaluateCandidate(candidate)
      expect(result.eligible).toBe(false)
      expect(result.reasons[0]).toMatch(/Unsupported memory type/)
    })

    it('rejects empty or whitespace-only content', () => {
      const empty = evaluateCandidate({ ...sampleCandidate, content: '' })
      expect(empty.eligible).toBe(false)
      expect(empty.reasons).toContain('Candidate content cannot be empty or whitespace-only.')

      const whitespace = evaluateCandidate({ ...sampleCandidate, content: '   \n  ' })
      expect(whitespace.eligible).toBe(false)
      expect(whitespace.reasons).toContain('Candidate content cannot be empty or whitespace-only.')
    })

    it('rejects content exceeding maxContentLength (300 chars)', () => {
      const longContent = 'A'.repeat(301)
      const result = evaluateCandidate({ ...sampleCandidate, content: longContent })
      expect(result.eligible).toBe(false)
      expect(result.reasons[0]).toMatch(/exceeds maximum length of 300/)
    })

    it('rejects invalid topic outside Conversation topic taxonomy', () => {
      const candidate = { ...sampleCandidate, topics: ['unsupported_topic'] }
      const result = evaluateCandidate(candidate)
      expect(result.eligible).toBe(false)
      expect(result.reasons[0]).toMatch(/Unsupported topic "unsupported_topic"/)
    })

    it('rejects empty topics array', () => {
      const candidate = { ...sampleCandidate, topics: [] }
      const result = evaluateCandidate(candidate)
      expect(result.eligible).toBe(false)
      expect(result.reasons).toContain('Candidate topics must be a non-empty array.')
    })

    it('rejects invalid workflow type', () => {
      const candidate = {
        ...sampleCandidate,
        workflowTypes: ['speculative-workflow'],
      }
      const result = evaluateCandidate(candidate)
      expect(result.eligible).toBe(false)
      expect(result.reasons[0]).toMatch(/Unsupported workflowType "speculative-workflow"/)
    })

    it('rejects empty workflowTypes array', () => {
      const candidate = { ...sampleCandidate, workflowTypes: [] }
      const result = evaluateCandidate(candidate)
      expect(result.eligible).toBe(false)
      expect(result.reasons).toContain('Candidate workflowTypes must be a non-empty array.')
    })

    it('rejects invalid importance', () => {
      const candidate = { ...sampleCandidate, importance: 'critical' }
      const result = evaluateCandidate(candidate)
      expect(result.eligible).toBe(false)
      expect(result.reasons[0]).toMatch(/Invalid candidate importance/)
    })

    it('produces purely deterministic results for identical candidate', () => {
      const r1 = evaluateCandidate(sampleCandidate)
      const r2 = evaluateCandidate(sampleCandidate)
      expect(r1).toEqual(r2)
    })

    it('does NOT semantically parse financial claims (verifying boundary constraint)', () => {
      // Content mentioning financial words is evaluated structurally without heuristic NLP
      const candidate = {
        ...sampleCandidate,
        content: 'User mentions remaining cash or cutoff balances in qualitative context.',
      }
      const result = evaluateCandidate(candidate)
      expect(result.eligible).toBe(true)
    })
  })

  // 2. Memory Record Tests
  describe('Memory Record', () => {
    it('creates immutable MemoryRecord with caller-supplied ID and createdAt', () => {
      const record = createMemoryRecord({
        candidate: sampleCandidate,
        memoryId: 'mem-001',
        createdAt: '2026-10-05T00:00:00.000Z',
      })

      expect(record.memoryId).toBe('mem-001')
      expect(record.type).toBe(MEMORY_TYPES.communicationPreference)
      expect(record.content).toBe('Prefers concise explanations.')
      expect(record.topics).toEqual(['general'])
      expect(record.workflowTypes).toEqual(['financial-summary-explanation'])
      expect(record.importance).toBe('medium')
      expect(record.source).toEqual({ type: 'user', referenceId: null })
      expect(record.createdAt).toBe('2026-10-05T00:00:00.000Z')

      expect(Object.isFrozen(record)).toBe(true)
      expect(Object.isFrozen(record.topics)).toBe(true)
      expect(Object.isFrozen(record.workflowTypes)).toBe(true)
      expect(Object.isFrozen(record.source)).toBe(true)
    })

    it('requires caller-supplied non-empty memoryId', () => {
      expect(() => {
        createMemoryRecord({
          candidate: sampleCandidate,
          createdAt: '2026-10-05T00:00:00.000Z',
        })
      }).toThrow(/requires a caller-supplied non-empty string memoryId/)

      expect(() => {
        createMemoryRecord({
          candidate: sampleCandidate,
          memoryId: '   ',
          createdAt: '2026-10-05T00:00:00.000Z',
        })
      }).toThrow(/requires a caller-supplied non-empty string memoryId/)
    })

    it('requires caller-supplied valid ISO-8601 createdAt timestamp', () => {
      expect(() => {
        createMemoryRecord({
          candidate: sampleCandidate,
          memoryId: 'mem-001',
        })
      }).toThrow(/requires a valid ISO-8601 createdAt timestamp string/)

      expect(() => {
        createMemoryRecord({
          candidate: sampleCandidate,
          memoryId: 'mem-001',
          createdAt: 'invalid-date',
        })
      }).toThrow(/requires a valid ISO-8601 createdAt timestamp string/)
    })

    it('rejects ineligible candidate upon creation', () => {
      expect(() => {
        createMemoryRecord({
          candidate: { ...sampleCandidate, explicitlyConfirmed: false },
          memoryId: 'mem-001',
          createdAt: '2026-10-05T00:00:00.000Z',
        })
      }).toThrow(/Candidate is not eligible for MemoryRecord/)
    })

    it('ensures confidence, status, expiresAt, and prohibited fields are absent', () => {
      const record = createMemoryRecord({
        candidate: sampleCandidate,
        memoryId: 'mem-001',
        createdAt: '2026-10-05T00:00:00.000Z',
      })

      expect(record.confidence).toBeUndefined()
      expect(record.status).toBeUndefined()
      expect(record.expiresAt).toBeUndefined()
      expect(record.updatedAt).toBeUndefined()
      expect(record.lastUsed).toBeUndefined()
      expect(record.collectionId).toBeUndefined()
      expect(record.embedding).toBeUndefined()
    })

    it('rejects record if prohibited fields are manually passed in validateMemoryRecord', () => {
      const record = {
        memoryId: 'mem-001',
        type: MEMORY_TYPES.communicationPreference,
        content: 'Valid content',
        topics: ['general'],
        workflowTypes: ['financial-summary-explanation'],
        importance: 'medium',
        source: { type: 'user' },
        createdAt: '2026-10-05T00:00:00.000Z',
        confidence: 1.0,
      }
      const validation = validateMemoryRecord(record)
      expect(validation.valid).toBe(false)
      expect(validation.errors[0]).toMatch(/Prohibited field "confidence"/)
    })
  })

  // 3. Memory DTO Tests
  describe('Memory DTO', () => {
    it('creates canonical frozen MemoryDTO with version 1.0.0', () => {
      const record = createMemoryRecord({
        candidate: sampleCandidate,
        memoryId: 'mem-001',
        createdAt: '2026-10-05T00:00:00.000Z',
      })
      const dto = createMemoryDto({ records: [record] })

      expect(dto.version).toBe(MEMORY_DTO_VERSION)
      expect(dto.records).toHaveLength(1)
      expect(Object.isFrozen(dto)).toBe(true)
      expect(Object.isFrozen(dto.records)).toBe(true)
    })

    it('rejects invalid version', () => {
      expect(() => {
        createMemoryDto({ version: '2.0.0' })
      }).toThrow(/MemoryDTO version must be "1.0.0"/)
    })

    it('rejects non-array records', () => {
      expect(() => {
        createMemoryDto({ records: 'invalid' })
      }).toThrow(/MemoryDTO records must be an array/)
    })

    it('rejects duplicate memoryId and does NOT silently deduplicate', () => {
      const r1 = createMemoryRecord({
        candidate: sampleCandidate,
        memoryId: 'mem-dup',
        createdAt: '2026-10-05T00:00:00.000Z',
      })
      const r2 = createMemoryRecord({
        candidate: { ...sampleCandidate, content: 'Different content' },
        memoryId: 'mem-dup',
        createdAt: '2026-10-05T00:01:00.000Z',
      })

      expect(() => {
        createMemoryDto({ records: [r1, r2] })
      }).toThrow(/Duplicate memoryId "mem-dup" is not allowed in MemoryDTO/)
    })

    it('does not mutate input records array', () => {
      const r1 = createMemoryRecord({
        candidate: sampleCandidate,
        memoryId: 'mem-001',
        createdAt: '2026-10-05T00:00:00.000Z',
      })
      const originalArray = [r1]
      createMemoryDto({ records: originalArray })
      expect(originalArray).toHaveLength(1)
      expect(Object.isFrozen(originalArray)).toBe(false)
    })

    it('addMemoryRecord returns a new MemoryDTO without mutating original', () => {
      const r1 = createMemoryRecord({
        candidate: sampleCandidate,
        memoryId: 'mem-001',
        createdAt: '2026-10-05T00:00:00.000Z',
      })
      const r2 = createMemoryRecord({
        candidate: sampleCandidate,
        memoryId: 'mem-002',
        createdAt: '2026-10-05T00:01:00.000Z',
      })

      const dto1 = createMemoryDto({ records: [r1] })
      const dto2 = addMemoryRecord(dto1, r2)

      expect(dto1.records).toHaveLength(1)
      expect(dto2.records).toHaveLength(2)
      expect(dto2.records[1].memoryId).toBe('mem-002')
    })

    it('addMemoryRecord rejects duplicate memoryId', () => {
      const r1 = createMemoryRecord({
        candidate: sampleCandidate,
        memoryId: 'mem-001',
        createdAt: '2026-10-05T00:00:00.000Z',
      })
      const dto = createMemoryDto({ records: [r1] })

      expect(() => {
        addMemoryRecord(dto, r1)
      }).toThrow(/already exists in MemoryDTO. Overwrite\/merge rejected/)
    })
  })

  // 4. Memory Policy Manager Tests
  describe('Memory Policy Manager', () => {
    it('provides immutable DEFAULT_MEMORY_POLICY', () => {
      const policy = getDefaultPolicy()
      expect(policy).toBe(DEFAULT_MEMORY_POLICY)
      expect(Object.isFrozen(policy)).toBe(true)
      expect(Object.isFrozen(policy.allowedMemoryTypes)).toBe(true)
      expect(Object.isFrozen(policy.allowedSources)).toBe(true)
      expect(Object.isFrozen(policy.allowedImportances)).toBe(true)
      expect(Object.isFrozen(policy.allowedTopics)).toBe(true)
      expect(Object.isFrozen(policy.allowedWorkflowTypes)).toBe(true)

      expect(policy.maxContentLength).toBe(300)
      expect(policy.maxRetrievedItems).toBe(5)
      expect(policy.maxTotalContextChars).toBe(1500)
      expect(policy.requireExplicitConfirmation).toBe(true)
    })

    it('allowed topics match Conversation topics taxonomy exactly', () => {
      const policy = getDefaultPolicy()
      expect([...policy.allowedTopics].sort()).toEqual(
        Object.values(CONVERSATION_TOPICS).sort(),
      )
    })

    it('allowed workflow types match approved financial-summary-explanation', () => {
      const policy = getDefaultPolicy()
      expect(policy.allowedWorkflowTypes).toEqual(['financial-summary-explanation'])
    })
  })

  // 5. Memory Retriever Tests
  describe('Memory Retriever', () => {
    const rGeneral = createMemoryRecord({
      candidate: { ...sampleCandidate, topics: ['general'] },
      memoryId: 'mem-gen',
      createdAt: '2026-10-05T00:00:00.000Z',
    })
    const rExpenses = createMemoryRecord({
      candidate: { ...sampleCandidate, topics: ['expenses'] },
      memoryId: 'mem-exp',
      createdAt: '2026-10-05T00:01:00.000Z',
    })
    const rSavings = createMemoryRecord({
      candidate: { ...sampleCandidate, topics: ['savings'] },
      memoryId: 'mem-sav',
      createdAt: '2026-10-05T00:02:00.000Z',
    })
    const testDto = createMemoryDto({ records: [rGeneral, rExpenses, rSavings] })

    it('requires valid query and workflowType', () => {
      expect(() => {
        retrieveMemories({ memoryDto: testDto, query: null })
      }).toThrow(/requires a valid query object/)

      expect(() => {
        retrieveMemories({ memoryDto: testDto, query: { workflowType: '' } })
      }).toThrow(/requires a non-empty string query.workflowType/)
    })

    it('matches exact workflow requirement', () => {
      const retrieved = retrieveMemories({
        memoryDto: testDto,
        query: { workflowType: 'unknown-workflow', topic: 'expenses' },
      })
      expect(retrieved).toHaveLength(0)
    })

    it('for specific topic query, returns exact topic match AND general memory', () => {
      const retrieved = retrieveMemories({
        memoryDto: testDto,
        query: { workflowType: 'financial-summary-explanation', topic: 'expenses' },
      })
      const ids = retrieved.map((r) => r.memoryId)
      expect(ids).toContain('mem-exp')
      expect(ids).toContain('mem-gen')
      expect(ids).not.toContain('mem-sav')
    })

    it('for general query, returns ONLY general-scoped memory (does not leak unrelated topics)', () => {
      const retrieved = retrieveMemories({
        memoryDto: testDto,
        query: { workflowType: 'financial-summary-explanation', topic: 'general' },
      })
      const ids = retrieved.map((r) => r.memoryId)
      expect(ids).toEqual(['mem-gen'])
      expect(ids).not.toContain('mem-exp')
      expect(ids).not.toContain('mem-sav')
    })

    it('defaults query topic to general if omitted or empty', () => {
      const retrieved = retrieveMemories({
        memoryDto: testDto,
        query: { workflowType: 'financial-summary-explanation' },
      })
      expect(retrieved.map((r) => r.memoryId)).toEqual(['mem-gen'])
    })

    it('does not mutate input DTO or records', () => {
      const recordsBefore = [...testDto.records]
      retrieveMemories({
        memoryDto: testDto,
        query: { workflowType: 'financial-summary-explanation', topic: 'expenses' },
      })
      expect(testDto.records).toEqual(recordsBefore)
    })
  })

  // 6. Memory Ranker Tests
  describe('Memory Ranker', () => {
    it('ranks exact topic match before general', () => {
      const rGeneral = createMemoryRecord({
        candidate: { ...sampleCandidate, topics: ['general'], importance: 'medium' },
        memoryId: 'mem-gen',
        createdAt: '2026-10-05T00:00:00.000Z',
      })
      const rExact = createMemoryRecord({
        candidate: { ...sampleCandidate, topics: ['expenses'], importance: 'medium' },
        memoryId: 'mem-exact',
        createdAt: '2026-10-05T00:00:00.000Z',
      })

      const ranked = rankMemories([rGeneral, rExact], {
        query: { topic: 'expenses', workflowType: 'financial-summary-explanation' },
      })
      expect(ranked[0].memoryId).toBe('mem-exact')
      expect(ranked[1].memoryId).toBe('mem-gen')
    })

    it('ranks importance: high > medium > low', () => {
      const rLow = createMemoryRecord({
        candidate: { ...sampleCandidate, importance: 'low' },
        memoryId: 'mem-low',
        createdAt: '2026-10-05T00:00:00.000Z',
      })
      const rMed = createMemoryRecord({
        candidate: { ...sampleCandidate, importance: 'medium' },
        memoryId: 'mem-med',
        createdAt: '2026-10-05T00:00:00.000Z',
      })
      const rHigh = createMemoryRecord({
        candidate: { ...sampleCandidate, importance: 'high' },
        memoryId: 'mem-high',
        createdAt: '2026-10-05T00:00:00.000Z',
      })

      const ranked = rankMemories([rLow, rMed, rHigh], {
        query: { topic: 'general', workflowType: 'financial-summary-explanation' },
      })
      expect(ranked.map((r) => r.memoryId)).toEqual(['mem-high', 'mem-med', 'mem-low'])
    })

    it('ranks newer createdAt before older createdAt', () => {
      const rOlder = createMemoryRecord({
        candidate: { ...sampleCandidate, importance: 'medium' },
        memoryId: 'mem-old',
        createdAt: '2026-10-01T00:00:00.000Z',
      })
      const rNewer = createMemoryRecord({
        candidate: { ...sampleCandidate, importance: 'medium' },
        memoryId: 'mem-new',
        createdAt: '2026-10-05T00:00:00.000Z',
      })

      const ranked = rankMemories([rOlder, rNewer], {
        query: { topic: 'general', workflowType: 'financial-summary-explanation' },
      })
      expect(ranked.map((r) => r.memoryId)).toEqual(['mem-new', 'mem-old'])
    })

    it('uses memoryId ascending as final deterministic tie-break', () => {
      const rA = createMemoryRecord({
        candidate: sampleCandidate,
        memoryId: 'mem-aaa',
        createdAt: '2026-10-05T00:00:00.000Z',
      })
      const rB = createMemoryRecord({
        candidate: sampleCandidate,
        memoryId: 'mem-bbb',
        createdAt: '2026-10-05T00:00:00.000Z',
      })

      const ranked = rankMemories([rB, rA], {
        query: { topic: 'general', workflowType: 'financial-summary-explanation' },
      })
      expect(ranked.map((r) => r.memoryId)).toEqual(['mem-aaa', 'mem-bbb'])
    })

    it('does not mutate input array', () => {
      const rA = createMemoryRecord({
        candidate: sampleCandidate,
        memoryId: 'mem-aaa',
        createdAt: '2026-10-05T00:00:00.000Z',
      })
      const rB = createMemoryRecord({
        candidate: sampleCandidate,
        memoryId: 'mem-bbb',
        createdAt: '2026-10-05T00:00:00.000Z',
      })
      const input = [rB, rA]
      rankMemories(input)
      expect(input[0].memoryId).toBe('mem-bbb')
    })
  })

  // 7. Memory Context Tests
  describe('Memory Context Builder & DTO', () => {
    it('returns null when records array is empty or null', () => {
      expect(buildMemoryContext({ records: [] })).toBeNull()
      expect(buildMemoryContext({ records: null })).toBeNull()
    })

    it('exposes ONLY type and content in prompt-facing items', () => {
      const record = createMemoryRecord({
        candidate: sampleCandidate,
        memoryId: 'mem-001',
        createdAt: '2026-10-05T00:00:00.000Z',
      })

      const context = buildMemoryContext({ records: [record] })
      expect(context.version).toBe(MEMORY_CONTEXT_VERSION)
      expect(context.items).toHaveLength(1)

      const item = context.items[0]
      expect(Object.keys(item).sort()).toEqual(['content', 'type'])
      expect(item.type).toBe(MEMORY_TYPES.communicationPreference)
      expect(item.content).toBe('Prefers concise explanations.')

      // Internal fields must NOT be exposed
      expect(item.memoryId).toBeUndefined()
      expect(item.importance).toBeUndefined()
      expect(item.topics).toBeUndefined()
      expect(item.workflowTypes).toBeUndefined()
      expect(item.source).toBeUndefined()
      expect(item.createdAt).toBeUndefined()
    })

    it('enforces maximum 5 items limit', () => {
      const records = Array.from({ length: 8 }, (_, i) =>
        createMemoryRecord({
          candidate: { ...sampleCandidate, content: `Content #${i}` },
          memoryId: `mem-${i}`,
          createdAt: '2026-10-05T00:00:00.000Z',
        }),
      )

      const context = buildMemoryContext({ records })
      expect(context.items).toHaveLength(5)
    })

    it('enforces total character ceiling (1500 chars) by excluding whole items', () => {
      // 5 items, each 300 chars = 1500 chars exactly
      const r1 = createMemoryRecord({
        candidate: { ...sampleCandidate, content: 'A'.repeat(300) },
        memoryId: 'mem-1',
        createdAt: '2026-10-05T00:00:00.000Z',
      })
      const r2 = createMemoryRecord({
        candidate: { ...sampleCandidate, content: 'B'.repeat(300) },
        memoryId: 'mem-2',
        createdAt: '2026-10-05T00:00:00.000Z',
      })
      const r3 = createMemoryRecord({
        candidate: { ...sampleCandidate, content: 'C'.repeat(300) },
        memoryId: 'mem-3',
        createdAt: '2026-10-05T00:00:00.000Z',
      })
      const r4 = createMemoryRecord({
        candidate: { ...sampleCandidate, content: 'D'.repeat(300) },
        memoryId: 'mem-4',
        createdAt: '2026-10-05T00:00:00.000Z',
      })
      const r5 = createMemoryRecord({
        candidate: { ...sampleCandidate, content: 'E'.repeat(300) },
        memoryId: 'mem-5',
        createdAt: '2026-10-05T00:00:00.000Z',
      })
      const r6 = createMemoryRecord({
        candidate: { ...sampleCandidate, content: 'F'.repeat(10) },
        memoryId: 'mem-6',
        createdAt: '2026-10-05T00:00:00.000Z',
      })

      const context = buildMemoryContext({ records: [r1, r2, r3, r4, r5, r6] })
      expect(context.items).toHaveLength(5)
      const totalLen = context.items.reduce((acc, it) => acc + it.content.length, 0)
      expect(totalLen).toBe(1500)
    })

    it('deduplicates duplicate memoryId preserving highest ranked', () => {
      const r1 = createMemoryRecord({
        candidate: { ...sampleCandidate, content: 'First content' },
        memoryId: 'mem-same',
        createdAt: '2026-10-05T00:00:00.000Z',
      })
      const r2 = { ...r1, content: 'Second content' }

      const context = buildMemoryContext({ records: [r1, r2] })
      expect(context.items).toHaveLength(1)
      expect(context.items[0].content).toBe('First content')
    })

    it('deduplicates exact normalized content preserving highest ranked', () => {
      const r1 = createMemoryRecord({
        candidate: { ...sampleCandidate, content: 'Prefers bullet points' },
        memoryId: 'mem-1',
        createdAt: '2026-10-05T00:00:00.000Z',
      })
      const r2 = createMemoryRecord({
        candidate: { ...sampleCandidate, content: '  prefers bullet points  ' },
        memoryId: 'mem-2',
        createdAt: '2026-10-05T00:01:00.000Z',
      })

      const context = buildMemoryContext({ records: [r1, r2] })
      expect(context.items).toHaveLength(1)
      expect(context.items[0].content).toBe('Prefers bullet points')
    })

    it('retrieveContext public convenience pipeline returns null when no matching records exist', () => {
      const r = createMemoryRecord({
        candidate: { ...sampleCandidate, topics: ['savings'] },
        memoryId: 'mem-sav',
        createdAt: '2026-10-05T00:00:00.000Z',
      })
      const dto = createMemoryDto({ records: [r] })

      const result = retrieveContext({
        memoryDto: dto,
        query: { workflowType: 'financial-summary-explanation', topic: 'income' },
      })
      expect(result).toBeNull()
    })

    it('retrieveContext returns valid MemoryContextDTO when matches exist', () => {
      const r = createMemoryRecord({
        candidate: { ...sampleCandidate, topics: ['expenses'] },
        memoryId: 'mem-exp',
        createdAt: '2026-10-05T00:00:00.000Z',
      })
      const dto = createMemoryDto({ records: [r] })

      const result = retrieveContext({
        memoryDto: dto,
        query: { workflowType: 'financial-summary-explanation', topic: 'expenses' },
      })
      expect(result).not.toBeNull()
      expect(result.version).toBe(MEMORY_CONTEXT_VERSION)
      expect(result.items).toHaveLength(1)
      expect(result.items[0].content).toBe('Prefers concise explanations.')
    })
  })

  // 8. Public memoryService Facade Tests
  describe('memoryService public facade', () => {
    it('has canonical name "memory-service", status "ready", and is frozen', () => {
      expect(memoryService.name).toBe('memory-service')
      expect(memoryService.status).toBe('ready')
      expect(Object.isFrozen(memoryService)).toBe(true)
    })

    it('exposes exactly approved public methods and properties', () => {
      expect(Object.keys(memoryService).sort()).toEqual([
        'addMemoryRecord',
        'createMemoryDto',
        'createMemoryRecord',
        'evaluateCandidate',
        'getPolicy',
        'name',
        'retrieveContext',
        'status',
        'validateMemoryContext',
        'validateMemoryDto',
      ])
    })

    it('exposes no prohibited operational AI methods', () => {
      const PROHIBITED = [
        'execute',
        'generate',
        'chat',
        'stream',
        'complete',
        'send',
        'invoke',
        'persist',
        'save',
        'delete',
        'repository',
      ]
      PROHIBITED.forEach((method) => {
        expect(memoryService[method]).toBeUndefined()
      })
    })
  })

  // 9. Memory Validators & Constants
  describe('Memory Validators & Constants', () => {
    it('verifies ALLOWED_WORKFLOW_TYPES contains financial-summary-explanation', () => {
      expect(ALLOWED_WORKFLOW_TYPES).toEqual(['financial-summary-explanation'])
    })

    it('validateMemoryCandidate validates valid candidate and detects missing fields', () => {
      expect(validateMemoryCandidate(sampleCandidate).valid).toBe(true)
      expect(validateMemoryCandidate(null).valid).toBe(false)
      expect(validateMemoryCandidate({}).valid).toBe(false)
    })

    it('validateMemoryRecord validates valid record and detects missing fields', () => {
      const record = createMemoryRecord({
        candidate: sampleCandidate,
        memoryId: 'mem-v-1',
        createdAt: '2026-10-05T00:00:00.000Z',
      })
      expect(validateMemoryRecord(record).valid).toBe(true)
      expect(validateMemoryRecord(null).valid).toBe(false)
    })

    it('validateMemoryDto validates valid DTO and detects invalid DTO', () => {
      const record = createMemoryRecord({
        candidate: sampleCandidate,
        memoryId: 'mem-v-1',
        createdAt: '2026-10-05T00:00:00.000Z',
      })
      const dto = createMemoryDto({ records: [record] })
      expect(validateMemoryDto(dto).valid).toBe(true)
      expect(validateMemoryDto(null).valid).toBe(false)
      expect(validateMemoryDto({ version: '1.0.0', records: 'not-array' }).valid).toBe(false)
    })

    it('validateMemoryContext validates valid context and detects malformed context', () => {
      const validContext = {
        version: '1.0.0',
        items: [{ type: 'communication_preference', content: 'Prefers bullet points' }],
      }
      expect(validateMemoryContext(validContext).valid).toBe(true)
      expect(validateMemoryContext(null).valid).toBe(false)
      expect(validateMemoryContext({ version: '2.0.0', items: [] }).valid).toBe(false)
    })
  })
})
