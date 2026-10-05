import { describe, expect, it } from 'vitest'
import { createMockProvider } from './providerMock.js'
import { assertAdapterContract } from '../providers/llmAdapter.js'
import { createProviderRegistry } from '../providers/providerRegistry.js'
import { createProviderRequest } from '../providers/providerRequest.js'
import { createProviderStreamRequest } from '../providers/providerStreamRequest.js'
import {
  ProviderError,
  PROVIDER_ERROR_CODES,
} from '../providers/providerErrors.js'

describe('Phase 11B.9 — Provider Mock', () => {
  const sampleRequest = createProviderRequest({
    providerId: 'ollama',
    model: 'llama3.2',
    promptPackage: {
      version: '1.0.0',
      systemPrompt: 'System instruction',
      userPrompt: 'Financial context',
      template: { id: 'financial-summary-explanation', version: '1.0.0' },
      task: 'financial-summary-explanation',
    },
  })

  const sampleStreamRequest = createProviderStreamRequest({
    providerId: 'ollama',
    model: 'llama3.2',
    promptPackage: {
      version: '1.0.0',
      systemPrompt: 'System instruction',
      userPrompt: 'Financial context',
      template: { id: 'financial-summary-explanation', version: '1.0.0' },
      task: 'financial-summary-explanation',
    },
  })

  it('satisfies production LLMAdapter contract and is accepted by production createProviderRegistry', () => {
    const mock = createMockProvider()
    expect(() => assertAdapterContract(mock)).not.toThrow()
    expect(mock.id).toBe('ollama')
    expect(mock.locality).toBe('local')

    const registry = createProviderRegistry([mock])
    expect(registry.getProviderAdapter('ollama')).toBe(mock)
    expect(registry.getProviderDescriptor('ollama')).toEqual({
      id: 'ollama',
      locality: 'local',
      status: 'active',
    })
  })

  it('generates deterministic canonical ProviderResponse with diagnostics', async () => {
    const mock = createMockProvider({
      generateScript: ['Deterministic insight explanation.'],
    })

    const response = await mock.generate(sampleRequest)
    expect(response.version).toBe('1.0.0')
    expect(response.providerId).toBe('ollama')
    expect(response.model).toBe('llama3.2')
    expect(response.content).toBe('Deterministic insight explanation.')
    expect(response.finishReason).toBe('stop')
    expect(response.diagnostics).toBeDefined()
    expect(response.diagnostics.version).toBe('1.0.0')
  })

  it('captures in-memory call history and preserves request immutability', async () => {
    const mock = createMockProvider({
      defaultResponseContent: 'Default response content.',
    })

    const originalRequestSnapshot = JSON.stringify(sampleRequest)
    const config = { transportTimeoutMs: 15000 }

    await mock.generate(sampleRequest, config)

    expect(JSON.stringify(sampleRequest)).toBe(originalRequestSnapshot)
    expect(mock.getCallCount()).toBe(1)

    const lastCall = mock.getLastCall()
    expect(lastCall.type).toBe('generate')
    expect(lastCall.attempt).toBe(1)
    expect(lastCall.request.model).toBe('llama3.2')
    expect(lastCall.config.transportTimeoutMs).toBe(15000)

    mock.clearCalls()
    expect(mock.getCallCount()).toBe(0)
    expect(mock.getLastCall()).toBeNull()
  })

  it('handles scripted retryable and non-retryable errors sequentially', async () => {
    const mock = createMockProvider({
      generateScript: [
        {
          errorCode: PROVIDER_ERROR_CODES.PROVIDER_UNAVAILABLE,
          message: 'Daemon is restarting.',
        },
        'Recovered response after retry.',
      ],
    })

    await expect(mock.generate(sampleRequest)).rejects.toThrowError(ProviderError)

    const call1 = mock.getLastCall()
    expect(call1.attempt).toBe(1)

    const recovered = await mock.generate(sampleRequest)
    expect(recovered.content).toBe('Recovered response after retry.')
    expect(mock.getCallCount()).toBe(2)
  })

  it('aborts generate immediately when AbortSignal is already triggered', async () => {
    const mock = createMockProvider()
    const controller = new AbortController()
    controller.abort()

    await expect(
      mock.generate(sampleRequest, { signal: controller.signal }),
    ).rejects.toThrowError(ProviderError)
  })

  it('streams ordered canonical fragments as an async generator', async () => {
    const mock = createMockProvider({
      streamScript: [
        [
          { textFragment: 'First part. ', done: false },
          { textFragment: 'Second part.', done: true },
        ],
      ],
    })

    const fragments = []
    for await (const frag of mock.stream(sampleStreamRequest)) {
      fragments.push(frag)
    }

    expect(fragments.length).toBe(2)
    expect(fragments[0].textFragment).toBe('First part. ')
    expect(fragments[0].done).toBe(false)
    expect(fragments[1].textFragment).toBe('Second part.')
    expect(fragments[1].done).toBe(true)

    expect(mock.getCallCount()).toBe(1)
    expect(mock.getLastCall().type).toBe('stream')
  })

  it('stops streaming when AbortSignal triggers during iteration', async () => {
    const controller = new AbortController()
    const mock = createMockProvider({
      streamScript: [
        [
          { textFragment: 'Fragment 1', done: false },
          { textFragment: 'Fragment 2', done: false },
          { textFragment: 'Fragment 3', done: true },
        ],
      ],
    })

    const generator = mock.stream(sampleStreamRequest, { signal: controller.signal })
    const first = await generator.next()
    expect(first.value.textFragment).toBe('Fragment 1')

    controller.abort()
    await expect(generator.next()).rejects.toThrow()
  })

  it('yields partial fragments before throwing scripted stream error (retry discard test)', async () => {
    const mock = createMockProvider({
      streamScript: [
        {
          fragments: [{ textFragment: 'Partial buffer', done: false }],
          errorCode: PROVIDER_ERROR_CODES.PROVIDER_UNAVAILABLE,
          message: 'Stream interrupted.',
        },
      ],
    })

    const generator = mock.stream(sampleStreamRequest)
    const first = await generator.next()
    expect(first.value.textFragment).toBe('Partial buffer')

    await expect(generator.next()).rejects.toThrowError(ProviderError)
  })
})
