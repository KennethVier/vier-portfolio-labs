import { describe, expect, it } from 'vitest'
import { streamingEngine } from './streamingEngine.js'
import { createTokenBuffer, MAX_BUFFER_CHARACTERS } from './tokenBuffer.js'
import {
  createStreamChunk,
  splitIntoStreamChunks,
  validateStreamChunk,
  MAX_CHUNK_CHARACTERS,
} from './streamChunk.js'
import {
  createStreamEvent,
  validateStreamEvent,
  STREAM_EVENT_TYPES,
} from './streamEvent.js'
import {
  createStreamDiagnostics,
  validateStreamDiagnostics,
} from './streamDiagnostics.js'
import {
  createStreamSession,
  STREAM_LIFECYCLE_STATES,
} from './streamManager.js'
import { STREAM_ERROR_CODES, StreamError } from './streamErrors.js'
import { parseNdjsonStream } from '../providers/ollama/ollamaStreamTransport.js'
import { createProviderStreamRequest } from '../providers/providerStreamRequest.js'
import { createServiceCoordinator } from '../orchestration/serviceCoordinator.js'
import { ProviderError, PROVIDER_ERROR_CODES } from '../providers/providerErrors.js'

describe('Phase 11B.8 — Streaming Engine', () => {
  // 1. Token Buffer Tests
  describe('Token Buffer', () => {
    it('accumulates text fragments in exact order and tracks character length', () => {
      const buffer = createTokenBuffer()
      expect(buffer.getLength()).toBe(0)
      expect(buffer.getContent()).toBe('')

      buffer.append('Hello')
      expect(buffer.getLength()).toBe(5)
      expect(buffer.getContent()).toBe('Hello')

      buffer.append(', ')
      buffer.append('world!')
      expect(buffer.getLength()).toBe(13)
      expect(buffer.getContent()).toBe('Hello, world!')
    })

    it('accepts content up to exactly 5000 characters', () => {
      const buffer = createTokenBuffer()
      const chunk2500 = 'a'.repeat(2500)
      buffer.append(chunk2500)
      buffer.append(chunk2500)

      expect(buffer.getLength()).toBe(MAX_BUFFER_CHARACTERS)
      expect(buffer.getLength()).toBe(5000)
      expect(buffer.getContent().length).toBe(5000)
    })

    it('rejects at character 5001 with BUFFER_OVERFLOW', () => {
      const buffer = createTokenBuffer()
      const chunk5000 = 'x'.repeat(5000)
      buffer.append(chunk5000)

      expect(() => {
        buffer.append('1')
      }).toThrowError(StreamError)

      try {
        buffer.append('1')
      } catch (err) {
        expect(err.code).toBe(STREAM_ERROR_CODES.BUFFER_OVERFLOW)
        expect(err.message).toContain('5000')
      }
    })

    it('clears buffer and resets length', () => {
      const buffer = createTokenBuffer()
      buffer.append('Some text')
      expect(buffer.getLength()).toBe(9)

      buffer.clear()
      expect(buffer.getLength()).toBe(0)
      expect(buffer.getContent()).toBe('')

      // Can append again after clear
      buffer.append('Fresh text')
      expect(buffer.getLength()).toBe(10)
      expect(buffer.getContent()).toBe('Fresh text')
    })

    it('closes buffer and rejects further appends', () => {
      const buffer = createTokenBuffer()
      buffer.append('Completed')
      buffer.close()

      expect(buffer.isClosed()).toBe(true)
      expect(() => {
        buffer.append('more')
      }).toThrowError(StreamError)
    })
  })

  // 2. Safe Chunking & Stream Chunk Model Tests
  describe('Safe Chunking & StreamChunk Model', () => {
    it('creates immutable stream chunk with version 1.0.0 and correct sequence', () => {
      const chunk = createStreamChunk({
        streamId: 'str-123',
        sequence: 1,
        content: 'Valid content',
      })

      expect(chunk.version).toBe('1.0.0')
      expect(chunk.streamId).toBe('str-123')
      expect(chunk.sequence).toBe(1)
      expect(chunk.content).toBe('Valid content')
      expect(Object.isFrozen(chunk)).toBe(true)

      const validation = validateStreamChunk(chunk)
      expect(validation.isValid).toBe(true)
    })

    it('splits text into chunks of maximum 256 characters without splitting surrogate pairs', () => {
      // 500 characters of regular ASCII
      const text = 'A'.repeat(500)
      const chunks = splitIntoStreamChunks(text, 'str-test-1')

      expect(chunks.length).toBe(2)
      expect(chunks[0].sequence).toBe(1)
      expect(chunks[0].content.length).toBe(256)
      expect(chunks[1].sequence).toBe(2)
      expect(chunks[1].content.length).toBe(244)

      const joined = chunks.map((c) => c.content).join('')
      expect(joined).toBe(text)
    })

    it('preserves UTF-16 surrogate pairs at chunk boundary (never splits surrogate pair)', () => {
      // Create text of 255 'B's followed by a 2-char emoji '🎉' (surrogate pair) followed by 10 'C's
      const prefix = 'B'.repeat(255)
      const emoji = '🎉' // \uD83C\uDF89 (2 code units)
      const suffix = 'C'.repeat(10)
      const text = prefix + emoji + suffix

      const chunks = splitIntoStreamChunks(text, 'str-test-emoji')

      // Chunk 0 should back off to 255 chars so emoji is kept together in Chunk 1
      expect(chunks[0].content.length).toBe(255)
      expect(chunks[0].content).toBe(prefix)
      expect(chunks[1].content.startsWith(emoji)).toBe(true)
      expect(chunks[1].content).toBe(emoji + suffix)

      const joined = chunks.map((c) => c.content).join('')
      expect(joined).toBe(text)
    })

    it('joining all published chunk contents equals the original response exactly without alteration', () => {
      const original = '  Leading whitespace, \nnewlines, and trailing whitespace.  '
      const chunks = splitIntoStreamChunks(original, 'str-ws')
      const joined = chunks.map((c) => c.content).join('')
      expect(joined).toBe(original)
    })
  })

  // 3. Stream Event Model Tests
  describe('Stream Event Model', () => {
    it('creates immutable stream events with valid lifecycle event types and sequence', () => {
      const event = createStreamEvent({
        streamId: 'str-456',
        eventType: STREAM_EVENT_TYPES.STARTED,
        sequence: 1,
        timestamp: '2026-10-05T00:00:00.000Z',
      })

      expect(event.version).toBe('1.0.0')
      expect(event.streamId).toBe('str-456')
      expect(event.eventType).toBe('started')
      expect(event.sequence).toBe(1)
      expect(Object.isFrozen(event)).toBe(true)

      const validation = validateStreamEvent(event)
      expect(validation.isValid).toBe(true)
    })

    it('ensures event sequence is distinct from chunk sequence', () => {
      const startedEvent = createStreamEvent({
        streamId: 'str-1',
        eventType: STREAM_EVENT_TYPES.STARTED,
        sequence: 1,
        timestamp: '2026-10-05T00:00:00.000Z',
      })

      const chunk = createStreamChunk({
        streamId: 'str-1',
        sequence: 1, // chunk sequence 1
        content: 'Hello',
      })

      const chunkEvent = createStreamEvent({
        streamId: 'str-1',
        eventType: STREAM_EVENT_TYPES.CHUNK,
        sequence: 2, // event sequence 2
        payload: chunk,
        timestamp: '2026-10-05T00:00:01.000Z',
      })

      expect(startedEvent.sequence).toBe(1)
      expect(chunkEvent.sequence).toBe(2)
      expect(chunkEvent.payload.sequence).toBe(1)
    })
  })

  // 4. Stream Diagnostics Tests
  describe('Stream Diagnostics', () => {
    it('creates sanitized diagnostics with no content, prompt, or sensitive information', () => {
      const diag = createStreamDiagnostics({
        streamId: 'str-diag',
        state: 'completed',
        providerFragmentsReceived: 10,
        chunksPublished: 2,
        charactersGenerated: 350,
        charactersPublished: 350,
        startedAt: '2026-10-05T00:00:00.000Z',
        providerCompletedAt: '2026-10-05T00:00:02.000Z',
        publicationStartedAt: '2026-10-05T00:00:02.100Z',
        completedAt: '2026-10-05T00:00:02.200Z',
        durationMs: 2200,
      })

      expect(diag.version).toBe('1.0.0')
      expect(diag.streamId).toBe('str-diag')
      expect(diag.charactersGenerated).toBe(350)
      expect(diag.charactersPublished).toBe(350)
      expect(diag.content).toBeUndefined()
      expect(diag.prompt).toBeUndefined()
      expect(diag.rawJson).toBeUndefined()

      const validation = validateStreamDiagnostics(diag)
      expect(validation.isValid).toBe(true)
    })
  })

  // 5. Stream Manager Lifecycle Tests
  describe('Stream Manager Lifecycle', () => {
    it('transitions through normal lifecycle: starting -> streaming -> validating -> publishing -> completed', () => {
      const session = createStreamSession({ streamId: 's-normal' })
      expect(session.getState()).toBe(STREAM_LIFECYCLE_STATES.STARTING)

      session.manager.transitionTo(STREAM_LIFECYCLE_STATES.STREAMING)
      expect(session.getState()).toBe(STREAM_LIFECYCLE_STATES.STREAMING)

      session.manager.transitionTo(STREAM_LIFECYCLE_STATES.VALIDATING)
      expect(session.getState()).toBe(STREAM_LIFECYCLE_STATES.VALIDATING)

      session.manager.transitionTo(STREAM_LIFECYCLE_STATES.PUBLISHING)
      expect(session.getState()).toBe(STREAM_LIFECYCLE_STATES.PUBLISHING)

      session.manager.transitionTo(STREAM_LIFECYCLE_STATES.COMPLETED)
      expect(session.getState()).toBe(STREAM_LIFECYCLE_STATES.COMPLETED)
    })

    it('rejects illegal state transitions with INVALID_STATE_TRANSITION', () => {
      const session = createStreamSession({ streamId: 's-illegal' })
      expect(() => {
        session.manager.transitionTo(STREAM_LIFECYCLE_STATES.COMPLETED)
      }).toThrowError(StreamError)
    })

    it('supports idempotent cancel() in active states and no-op in completed state', () => {
      const session = createStreamSession({ streamId: 's-cancel' })
      session.cancel('User requested cancellation')
      expect(session.getState()).toBe(STREAM_LIFECYCLE_STATES.CANCELLED)

      // Double cancel is idempotent
      session.cancel('Second cancellation')
      expect(session.getState()).toBe(STREAM_LIFECYCLE_STATES.CANCELLED)

      // Completed stream cancel is no-op
      const session2 = createStreamSession({ streamId: 's-complete-cancel' })
      session2.manager.transitionTo(STREAM_LIFECYCLE_STATES.STREAMING)
      session2.manager.transitionTo(STREAM_LIFECYCLE_STATES.VALIDATING)
      session2.manager.transitionTo(STREAM_LIFECYCLE_STATES.PUBLISHING)
      session2.manager.transitionTo(STREAM_LIFECYCLE_STATES.COMPLETED)
      session2.cancel('After completion')
      expect(session2.getState()).toBe(STREAM_LIFECYCLE_STATES.COMPLETED)
    })
  })

  // 6. Public streamingEngine Facade Tests
  describe('streamingEngine Public Facade', () => {
    it('exports status ready, canonical name, and startStream function', () => {
      expect(streamingEngine.name).toBe('streaming-engine')
      expect(streamingEngine.status).toBe('ready')
      expect(typeof streamingEngine.startStream).toBe('function')
      expect(Object.isFrozen(streamingEngine)).toBe(true)
    })

    it('startStream returns an isolated session handle with streamId, cancel, getDiagnostics, and promise', () => {
      const handle = streamingEngine.startStream({ streamId: 'custom-stream-id' })
      expect(handle.streamId).toBe('custom-stream-id')
      expect(typeof handle.cancel).toBe('function')
      expect(typeof handle.getDiagnostics).toBe('function')
      expect(handle.promise).toBeInstanceOf(Promise)
      expect(handle.session).toBeUndefined()
    })
  })

  // 7. NDJSON Stream Parser Tests
  describe('Ollama NDJSON Stream Parser', () => {
    function makeReadableStream(chunks) {
      return new ReadableStream({
        start(controller) {
          for (const chunk of chunks) {
            controller.enqueue(typeof chunk === 'string' ? new TextEncoder().encode(chunk) : chunk)
          }
          controller.close()
        },
      })
    }

    it('parses multiple NDJSON records in a single chunk', async () => {
      const ndjson =
        JSON.stringify({ model: 'llama3.2', response: 'Hello', done: false }) +
        '\n' +
        JSON.stringify({ model: 'llama3.2', response: ' world', done: true }) +
        '\n'

      const fragments = []
      for await (const frag of parseNdjsonStream(makeReadableStream([ndjson]), {
        providerId: 'ollama',
        model: 'llama3.2',
      })) {
        fragments.push(frag)
      }

      expect(fragments.length).toBe(2)
      expect(fragments[0].textFragment).toBe('Hello')
      expect(fragments[0].done).toBe(false)
      expect(fragments[1].textFragment).toBe(' world')
      expect(fragments[1].done).toBe(true)
    })

    it('parses records split across transport chunks', async () => {
      const rec1PartA = '{"model":"llama3.2","response":"Good'
      const rec1PartB = ' morning","done":false}\n'

      const fragments = []
      for await (const frag of parseNdjsonStream(makeReadableStream([rec1PartA, rec1PartB]), {
        providerId: 'ollama',
        model: 'llama3.2',
      })) {
        fragments.push(frag)
      }

      expect(fragments.length).toBe(1)
      expect(fragments[0].textFragment).toBe('Good morning')
    })

    it('parses UTF-8 multibyte characters split across network packets', async () => {
      // Peso sign ₱ is 3 bytes: 0xE2, 0x82, 0xB1
      const jsonPrefix = '{"model":"llama3.2","response":"₱'
      const jsonSuffix = '500","done":false}\n'

      const encodedPrefix = new TextEncoder().encode(jsonPrefix)
      const encodedSuffix = new TextEncoder().encode(jsonSuffix)

      const len = encodedPrefix.length
      const part1 = encodedPrefix.slice(0, len - 2)
      const part2 = encodedPrefix.slice(len - 2)
      const part3 = encodedSuffix

      const fragments = []
      for await (const frag of parseNdjsonStream(makeReadableStream([part1, part2, part3]), {
        providerId: 'ollama',
        model: 'llama3.2',
      })) {
        fragments.push(frag)
      }

      expect(fragments.length).toBe(1)
      expect(fragments[0].textFragment).toBe('₱500')
    })

    it('ignores blank lines in NDJSON', async () => {
      const ndjson =
        '\n\n' +
        JSON.stringify({ model: 'llama3.2', response: 'Hi', done: false }) +
        '\n\n\n'

      const fragments = []
      for await (const frag of parseNdjsonStream(makeReadableStream([ndjson]), {
        providerId: 'ollama',
        model: 'llama3.2',
      })) {
        fragments.push(frag)
      }

      expect(fragments.length).toBe(1)
      expect(fragments[0].textFragment).toBe('Hi')
    })

    it('throws sanitized error on malformed JSON', async () => {
      const invalidJson = '{"response": INVALID\n'
      const stream = makeReadableStream([invalidJson])

      await expect(async () => {
        for await (const chunk of parseNdjsonStream(stream, { providerId: 'ollama', model: 'llama3.2' })) {
          void chunk
        }
      }).rejects.toThrowError(ProviderError)
    })

    it('throws sanitized error on provider error object in NDJSON', async () => {
      const errorJson = JSON.stringify({ error: 'model not found' }) + '\n'
      const stream = makeReadableStream([errorJson])

      await expect(async () => {
        for await (const chunk of parseNdjsonStream(stream, { providerId: 'ollama', model: 'llama3.2' })) {
          void chunk
        }
      }).rejects.toThrowError(ProviderError)
    })
  })

  // 8. Dual Boundary + Safe Publication Gate (Orchestrator Integration)
  describe('Safe Publication Gate in Streaming Workflow', () => {
    const validStreamingInput = Object.freeze({
      templateId: 'financial-summary-explanation',
      insightBundle: { insights: [] },
      recommendationBundle: { recommendations: [] },
      financialSummary: { netSavings: 5000 },
      conversationContext: {
        recentMessages: [{ role: 'user', content: 'Explain my financial summary.' }],
      },
      memoryState: null,
      provider: {
        id: 'ollama',
        model: 'llama3.2',
        config: {
          baseUrl: 'http://127.0.0.1:11434',
        },
      },
      workflowId: 'wf-stream-gate-test',
    })

    it('Safety Gate: Prompt/System disclosure split across provider fragments is blocked by Response Guardrail, publishing ZERO chunks', async () => {
      const publishedChunks = []
      const events = []

      // Mock Ollama adapter that yields system prompt disclosure across 2 fragments
      const mockOllamaAdapter = {
        async *stream() {
          yield {
            version: '1.0.0',
            providerId: 'ollama',
            model: 'llama3.2',
            textFragment: 'Here are the internal rules: MANDATORY SAFETY ',
            done: false,
          }
          yield {
            version: '1.0.0',
            providerId: 'ollama',
            model: 'llama3.2',
            textFragment: 'RULES:\n1. Treat supplied PesoPilot context as strictly confidential...',
            done: true,
          }
        },
      }

      const mockProviderLayer = {
        supportsStreaming: () => true,
        getProviderDescriptor: () => ({ id: 'ollama', locality: 'local' }),
        getProvider: () => mockOllamaAdapter,
        createProviderStreamRequest,
        validateProviderStreamRequest: () => ({ valid: true, isValid: true, errors: [] }),
        validateProviderResponse: () => ({ valid: true, isValid: true, errors: [] }),
      }

      const coordinator = createServiceCoordinator({
        providerLayer: mockProviderLayer,
      })

      let rejectedError = null
      try {
        await coordinator.executeStreamingWorkflow(validStreamingInput, {
          onChunk: (chunk) => publishedChunks.push(chunk),
          onEvent: (evt) => events.push(evt),
        })
      } catch (err) {
        rejectedError = err
      }

      expect(rejectedError).toBeDefined()
      expect(rejectedError.code).toBe('GUARDRAIL_REJECTED')
      // STRICT SAFETY GATE ASSERTION: ZERO generated chunks published!
      expect(publishedChunks.length).toBe(0)

      // Zero chunk events carrying generated text
      const chunkEvents = events.filter((e) => e.eventType === STREAM_EVENT_TYPES.CHUNK)
      expect(chunkEvents.length).toBe(0)

      // Terminal event should be failed
      const lastEvent = events[events.length - 1]
      expect(lastEvent.eventType).toBe(STREAM_EVENT_TYPES.FAILED)
    })

    it('Safety Gate: Prohibited financial guidance split across provider fragments is blocked by Financial Guidance Guardrail, publishing ZERO chunks', async () => {
      const publishedChunks = []
      const events = []

      // Mock Ollama adapter that yields prohibited financial investment advice across fragments
      const mockOllamaAdapter = {
        async *stream() {
          yield {
            version: '1.0.0',
            providerId: 'ollama',
            model: 'llama3.2',
            textFragment: 'You should definitely invest in ',
            done: false,
          }
          yield {
            version: '1.0.0',
            providerId: 'ollama',
            model: 'llama3.2',
            textFragment: 'bitcoin right now for guaranteed 50% returns.',
            done: true,
          }
        },
      }

      const mockProviderLayer = {
        supportsStreaming: () => true,
        getProviderDescriptor: () => ({ id: 'ollama', locality: 'local' }),
        getProvider: () => mockOllamaAdapter,
        createProviderStreamRequest,
        validateProviderStreamRequest: () => ({ valid: true, isValid: true, errors: [] }),
        validateProviderResponse: () => ({ valid: true, isValid: true, errors: [] }),
      }

      const coordinator = createServiceCoordinator({
        providerLayer: mockProviderLayer,
      })

      let rejectedError = null
      try {
        await coordinator.executeStreamingWorkflow(validStreamingInput, {
          onChunk: (chunk) => publishedChunks.push(chunk),
          onEvent: (evt) => events.push(evt),
        })
      } catch (err) {
        rejectedError = err
      }

      expect(rejectedError).toBeDefined()
      expect(rejectedError.code).toBe('GUARDRAIL_REJECTED')
      // ZERO chunks published!
      expect(publishedChunks.length).toBe(0)

      // Zero chunk events carrying generated text
      const chunkEvents = events.filter((e) => e.eventType === STREAM_EVENT_TYPES.CHUNK)
      expect(chunkEvents.length).toBe(0)
    })

    it('Success: Safe fragmented response is validated and published in deterministic <=256 char chunks', async () => {
      const publishedChunks = []
      const events = []

      const mockText = 'Your net savings of ₱5,000 this month is on track. Consider maintaining your current budget.'
      const mockOllamaAdapter = {
        async *stream() {
          yield {
            version: '1.0.0',
            providerId: 'ollama',
            model: 'llama3.2',
            textFragment: 'Your net savings of ₱5,000 ',
            done: false,
          }
          yield {
            version: '1.0.0',
            providerId: 'ollama',
            model: 'llama3.2',
            textFragment: 'this month is on track. Consider maintaining your current budget.',
            done: true,
          }
        },
      }

      const mockProviderLayer = {
        supportsStreaming: () => true,
        getProviderDescriptor: () => ({ id: 'ollama', locality: 'local' }),
        getProvider: () => mockOllamaAdapter,
        createProviderStreamRequest,
        validateProviderStreamRequest: () => ({ valid: true, isValid: true, errors: [] }),
        validateProviderResponse: () => ({ valid: true, isValid: true, errors: [] }),
      }

      const coordinator = createServiceCoordinator({
        providerLayer: mockProviderLayer,
      })

      const result = await coordinator.executeStreamingWorkflow(validStreamingInput, {
        onChunk: (chunk) => publishedChunks.push(chunk),
        onEvent: (evt) => events.push(evt),
      })

      expect(result.workflow.status).toBe('succeeded')
      expect(publishedChunks.length).toBeGreaterThan(0)

      // Joining published chunks must EXACTLY match the reconstructed response
      const joined = publishedChunks.map((c) => c.content).join('')
      expect(joined).toBe(mockText)

      // Each chunk sequence is strictly 1..N
      publishedChunks.forEach((c, idx) => {
        expect(c.sequence).toBe(idx + 1)
        expect(c.content.length).toBeLessThanOrEqual(MAX_CHUNK_CHARACTERS)
      })

      // Lifecycle events in order: started -> chunk(s) -> completed
      expect(events[0].eventType).toBe(STREAM_EVENT_TYPES.STARTED)
      expect(events[events.length - 1].eventType).toBe(STREAM_EVENT_TYPES.COMPLETED)
    })

    it('Retry: Discards attempt 1 buffer and publishes only attempt 2 content on retryable failure', async () => {
      const publishedChunks = []
      let attempt = 0

      const mockOllamaAdapter = {
        async *stream() {
          attempt++
          if (attempt === 1) {
            // Attempt 1 yields partial text into buffer before failing
            yield {
              version: '1.0.0',
              providerId: 'ollama',
              model: 'llama3.2',
              textFragment: 'Attempt 1 partial buffer that must be discarded.',
              done: false,
            }
            throw new ProviderError({
              code: PROVIDER_ERROR_CODES.PROVIDER_UNAVAILABLE,
              message: 'Daemon temporary blip',
            })
          }
          yield {
            version: '1.0.0',
            providerId: 'ollama',
            model: 'llama3.2',
            textFragment: 'Successful explanation on attempt 2.',
            done: true,
          }
        },
      }

      const mockProviderLayer = {
        supportsStreaming: () => true,
        getProviderDescriptor: () => ({ id: 'ollama', locality: 'local' }),
        getProvider: () => mockOllamaAdapter,
        createProviderStreamRequest,
        validateProviderStreamRequest: () => ({ valid: true, isValid: true, errors: [] }),
        validateProviderResponse: () => ({ valid: true, isValid: true, errors: [] }),
      }

      const coordinator = createServiceCoordinator({
        providerLayer: mockProviderLayer,
      })

      const result = await coordinator.executeStreamingWorkflow(validStreamingInput, {
        onChunk: (chunk) => publishedChunks.push(chunk),
      })

      expect(result.workflow.status).toBe('succeeded')
      expect(attempt).toBe(2)
      const joined = publishedChunks.map((c) => c.content).join('')
      expect(joined).toBe('Successful explanation on attempt 2.')
      // Proves attempt 1 buffer was discarded completely
      expect(joined).not.toContain('Attempt 1')
    })

    it('5001 Overflow: Exceeding 5000 character limit aborts transport signal, clears buffer, and publishes zero chunks', async () => {
      const publishedChunks = []
      const events = []
      let capturedSignal = null

      const mockOllamaAdapter = {
        async *stream(req, cfg) {
          capturedSignal = cfg?.signal || null
          // Yield 5000 characters (within 5000-char limit)
          yield {
            version: '1.0.0',
            providerId: 'ollama',
            model: 'llama3.2',
            textFragment: 'x'.repeat(5000),
            done: false,
          }
          // Yield 1 more character (character 5001 - must trigger BUFFER_OVERFLOW)
          yield {
            version: '1.0.0',
            providerId: 'ollama',
            model: 'llama3.2',
            textFragment: '!',
            done: false,
          }
        },
      }

      const mockProviderLayer = {
        supportsStreaming: () => true,
        getProviderDescriptor: () => ({ id: 'ollama', locality: 'local' }),
        getProvider: () => mockOllamaAdapter,
        createProviderStreamRequest,
        validateProviderStreamRequest: () => ({ valid: true, isValid: true, errors: [] }),
        validateProviderResponse: () => ({ valid: true, isValid: true, errors: [] }),
      }

      const coordinator = createServiceCoordinator({
        providerLayer: mockProviderLayer,
      })

      let workflowErr = null
      try {
        await coordinator.executeStreamingWorkflow(validStreamingInput, {
          onChunk: (chunk) => publishedChunks.push(chunk),
          onEvent: (evt) => events.push(evt),
        })
      } catch (err) {
        workflowErr = err
      }

      expect(workflowErr).toBeDefined()
      expect(workflowErr.code).toBe('PROVIDER_EXECUTION_FAILED')
      // 1. Proves transport HTTP signal was aborted
      expect(capturedSignal).toBeDefined()
      expect(capturedSignal.aborted).toBe(true)
      // 2. Proves zero chunks published
      expect(publishedChunks.length).toBe(0)
      // 3. Proves zero chunk events
      const chunkEvents = events.filter((e) => e.eventType === STREAM_EVENT_TYPES.CHUNK)
      expect(chunkEvents.length).toBe(0)
    })

    it('Cancellation during streaming halts provider and publishes zero chunks', async () => {
      const publishedChunks = []
      let cancelledSession = null

      const mockOllamaAdapter = {
        async *stream(req, cfg) {
          yield {
            version: '1.0.0',
            providerId: 'ollama',
            model: 'llama3.2',
            textFragment: 'First part of text',
            done: false,
          }
          // User cancels while streaming
          cancelledSession.cancel('User stopped stream')

          // Check signal
          if (cfg?.signal && cfg.signal.aborted) {
            const err = new Error('Aborted')
            err.name = 'AbortError'
            throw err
          }

          yield {
            version: '1.0.0',
            providerId: 'ollama',
            model: 'llama3.2',
            textFragment: 'Second part of text',
            done: true,
          }
        },
      }

      const mockProviderLayer = {
        supportsStreaming: () => true,
        getProviderDescriptor: () => ({ id: 'ollama', locality: 'local' }),
        getProvider: () => mockOllamaAdapter,
        createProviderStreamRequest,
        validateProviderStreamRequest: () => ({ valid: true, isValid: true, errors: [] }),
        validateProviderResponse: () => ({ valid: true, isValid: true, errors: [] }),
      }

      const coordinator = createServiceCoordinator({
        providerLayer: mockProviderLayer,
      })

      const session = createStreamSession({ streamId: 'cancel-test' })
      cancelledSession = session

      let caughtErr = null
      try {
        await coordinator.executeStreamingWorkflow(validStreamingInput, {
          session,
          onChunk: (chunk) => publishedChunks.push(chunk),
        })
      } catch (err) {
        caughtErr = err
      }

      expect(caughtErr).toBeDefined()
      expect(session.getState()).toBe('cancelled')
      expect(publishedChunks.length).toBe(0)
    })

    it('Cancellation during chunk publication callback stops later chunks from emitting', async () => {
      const publishedChunks = []
      let streamSessionRef = null

      // Create text that splits into 3 chunks
      const longText = 'A'.repeat(256) + 'B'.repeat(256) + 'C'.repeat(50)

      const mockOllamaAdapter = {
        async *stream() {
          yield {
            version: '1.0.0',
            providerId: 'ollama',
            model: 'llama3.2',
            textFragment: longText,
            done: true,
          }
        },
      }

      const mockProviderLayer = {
        supportsStreaming: () => true,
        getProviderDescriptor: () => ({ id: 'ollama', locality: 'local' }),
        getProvider: () => mockOllamaAdapter,
        createProviderStreamRequest,
        validateProviderStreamRequest: () => ({ valid: true, isValid: true, errors: [] }),
        validateProviderResponse: () => ({ valid: true, isValid: true, errors: [] }),
      }

      const coordinator = createServiceCoordinator({
        providerLayer: mockProviderLayer,
      })

      const session = createStreamSession({ streamId: 'chunk-cancel-test' })
      streamSessionRef = session

      let caughtErr = null
      try {
        await coordinator.executeStreamingWorkflow(validStreamingInput, {
          session,
          onChunk: (chunk) => {
            publishedChunks.push(chunk)
            if (chunk.sequence === 1) {
              // Cancel on first chunk
              streamSessionRef.cancel('Cancelled after chunk 1')
            }
          },
        })
      } catch (err) {
        caughtErr = err
      }

      expect(caughtErr).toBeDefined()
      expect(session.getState()).toBe('cancelled')
      // Only 1 chunk published before cancellation halted emission!
      expect(publishedChunks.length).toBe(1)
    })
  })
})
