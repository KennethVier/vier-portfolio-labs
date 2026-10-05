import { describe, expect, it } from 'vitest'
import { createMockProvider } from './providerMock.js'
import { createMockProviderLayer } from './providerMockLayer.js'
import { createServiceCoordinator } from '../orchestration/serviceCoordinator.js'
import { createSyntheticWorkflowInput } from './fixtures/syntheticFixtures.js'

describe('Phase 11B.9 — Provider Mock Layer', () => {
  it('wraps mock adapter in a compliant Provider Layer reusing production validators', () => {
    const mockAdapter = createMockProvider()
    const mockLayer = createMockProviderLayer(mockAdapter)

    expect(mockLayer.name).toBe('provider-layer')
    expect(mockLayer.status).toBe('ready')
    expect(typeof mockLayer.getProvider).toBe('function')
    expect(typeof mockLayer.getProviderDescriptor).toBe('function')
    expect(typeof mockLayer.supportsStreaming).toBe('function')
    expect(typeof mockLayer.validateProviderResponse).toBe('function')
    expect(typeof mockLayer.validateProviderRequest).toBe('function')

    expect(mockLayer.getProvider('ollama')).toBe(mockAdapter)
    expect(mockLayer.supportsStreaming('ollama')).toBe(true)

    // Prove production validators are used
    const validCheck = mockLayer.validateProviderResponse({
      version: '1.0.0',
      providerId: 'ollama',
      model: 'llama3.2',
      content: 'Hello world',
      finishReason: 'stop',
      diagnostics: {
        version: '1.0.0',
        providerId: 'ollama',
        model: 'llama3.2',
        totalDurationNs: null,
        loadDurationNs: null,
        promptEvalCount: null,
        evalCount: null,
      },
    })
    expect(validCheck.valid).toBe(true)

    const invalidCheck = mockLayer.validateProviderResponse({ invalid: true })
    expect(invalidCheck.valid).toBe(false)
  })

  it('can be injected directly into createServiceCoordinator as providerLayer', async () => {
    const mockAdapter = createMockProvider({
      generateScript: ['Explanation through mock provider layer.'],
    })
    const mockLayer = createMockProviderLayer(mockAdapter)

    const coordinator = createServiceCoordinator({
      providerLayer: mockLayer,
    })

    const input = createSyntheticWorkflowInput()
    const result = await coordinator.executeWorkflow(input)

    expect(result.workflow.status).toBe('succeeded')
    expect(result.response.content).toBe('Explanation through mock provider layer.')
    expect(mockAdapter.getCallCount()).toBe(1)
  })
})
