import { describe, expect, it } from 'vitest'
import * as aiInsights from './index.js'
import {
  aiGateway,
  promptBuilder,
  conversationEngine,
  providerLayer,
  guardrailEngine,
  aiOrchestrator,
  memoryService,
  streamingEngine,
} from './index.js'

describe('AI Platform Foundation', () => {
  const EXPECTED_CAPABILITIES = [
    {
      exportName: 'aiGateway',
      instance: aiGateway,
      canonicalName: 'ai-gateway',
    },
    {
      exportName: 'promptBuilder',
      instance: promptBuilder,
      canonicalName: 'prompt-builder',
    },
    {
      exportName: 'conversationEngine',
      instance: conversationEngine,
      canonicalName: 'conversation-engine',
    },
    {
      exportName: 'providerLayer',
      instance: providerLayer,
      canonicalName: 'provider-layer',
    },
    {
      exportName: 'guardrailEngine',
      instance: guardrailEngine,
      canonicalName: 'guardrail-engine',
    },
    {
      exportName: 'aiOrchestrator',
      instance: aiOrchestrator,
      canonicalName: 'ai-orchestrator',
    },
    {
      exportName: 'memoryService',
      instance: memoryService,
      canonicalName: 'memory-service',
    },
    {
      exportName: 'streamingEngine',
      instance: streamingEngine,
      canonicalName: 'streaming-engine',
    },
  ]

  it('exports all eight canonical capabilities and no unrelated exports', () => {
    const exportedKeys = Object.keys(aiInsights).sort()
    const expectedKeys = EXPECTED_CAPABILITIES.map((c) => c.exportName).sort()

    expect(exportedKeys).toEqual(expectedKeys)
    expect(exportedKeys).toHaveLength(8)
  })

  it.each(EXPECTED_CAPABILITIES)(
    'ensures $exportName has canonical name "$canonicalName" and status "placeholder"',
    ({ instance, canonicalName }) => {
      expect(instance).toBeDefined()
      expect(instance.name).toBe(canonicalName)
      expect(instance.status).toBe('placeholder')
    }
  )

  it.each(EXPECTED_CAPABILITIES)(
    'ensures $exportName is frozen and immutable',
    ({ instance }) => {
      expect(Object.isFrozen(instance)).toBe(true)

      expect(() => {
        instance.status = 'active'
      }).toThrow()

      expect(() => {
        instance.newProp = 'illegal'
      }).toThrow()
    }
  )

  it.each(EXPECTED_CAPABILITIES)(
    'ensures $exportName exposes no operational AI methods',
    ({ instance }) => {
      const functionProperties = Object.keys(instance).filter(
        (key) => typeof instance[key] === 'function'
      )
      expect(functionProperties).toEqual([])

      const PROHIBITED_METHODS = [
        'execute',
        'generate',
        'chat',
        'stream',
        'complete',
        'send',
        'invoke',
      ]
      PROHIBITED_METHODS.forEach((method) => {
        expect(instance[method]).toBeUndefined()
      })

      expect(Object.keys(instance).sort()).toEqual(['name', 'status'])
    }
  )
})
