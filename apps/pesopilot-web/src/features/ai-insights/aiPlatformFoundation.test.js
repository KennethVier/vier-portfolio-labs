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
  createPromptPackage,
  PROMPT_PACKAGE_VERSION,
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

  const PLACEHOLDER_CAPABILITIES = EXPECTED_CAPABILITIES.filter(
    (c) => c.exportName !== 'promptBuilder',
  )

  it('exports all eight canonical capabilities and PromptPackage DTO helpers, with no unrelated exports', () => {
    const exportedKeys = Object.keys(aiInsights).sort()
    const expectedKeys = [
      ...EXPECTED_CAPABILITIES.map((c) => c.exportName),
      'createPromptPackage',
      'PROMPT_PACKAGE_VERSION',
    ].sort()

    expect(exportedKeys).toEqual(expectedKeys)
    expect(exportedKeys).toHaveLength(10)
    expect(typeof createPromptPackage).toBe('function')
    expect(PROMPT_PACKAGE_VERSION).toBe('1.0.0')
  })

  // Prompt Builder 11B.1 Assertions
  it('ensures promptBuilder has canonical name "prompt-builder", status "ready", and build function', () => {
    expect(promptBuilder).toBeDefined()
    expect(promptBuilder.name).toBe('prompt-builder')
    expect(promptBuilder.status).toBe('ready')
    expect(typeof promptBuilder.build).toBe('function')
  })

  it('ensures promptBuilder is frozen and immutable', () => {
    expect(Object.isFrozen(promptBuilder)).toBe(true)

    expect(() => {
      promptBuilder.status = 'active'
    }).toThrow()

    expect(() => {
      promptBuilder.newProp = 'illegal'
    }).toThrow()
  })

  it('ensures promptBuilder exposes no unauthorized or operational AI methods', () => {
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
      expect(promptBuilder[method]).toBeUndefined()
    })

    expect(Object.keys(promptBuilder).sort()).toEqual([
      'build',
      'name',
      'status',
    ])
  })

  // Preserved Placeholder Assertions for the other 7 modules
  it.each(PLACEHOLDER_CAPABILITIES)(
    'ensures $exportName has canonical name "$canonicalName" and status "placeholder"',
    ({ instance, canonicalName }) => {
      expect(instance).toBeDefined()
      expect(instance.name).toBe(canonicalName)
      expect(instance.status).toBe('placeholder')
    },
  )

  it.each(PLACEHOLDER_CAPABILITIES)(
    'ensures $exportName is frozen and immutable',
    ({ instance }) => {
      expect(Object.isFrozen(instance)).toBe(true)

      expect(() => {
        instance.status = 'active'
      }).toThrow()

      expect(() => {
        instance.newProp = 'illegal'
      }).toThrow()
    },
  )

  it.each(PLACEHOLDER_CAPABILITIES)(
    'ensures $exportName exposes no operational AI methods',
    ({ instance }) => {
      const functionProperties = Object.keys(instance).filter(
        (key) => typeof instance[key] === 'function',
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
    },
  )
})
