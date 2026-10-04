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
    (c) =>
      c.exportName !== 'promptBuilder' &&
      c.exportName !== 'conversationEngine' &&
      c.exportName !== 'providerLayer' &&
      c.exportName !== 'aiOrchestrator',
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

  // Conversation Engine 11B.2 Assertions
  it('ensures conversationEngine has canonical name "conversation-engine", status "ready", and lifecycle functions', () => {
    expect(conversationEngine).toBeDefined()
    expect(conversationEngine.name).toBe('conversation-engine')
    expect(conversationEngine.status).toBe('ready')
    expect(typeof conversationEngine.startConversation).toBe('function')
    expect(typeof conversationEngine.appendMessage).toBe('function')
    expect(typeof conversationEngine.updateTopic).toBe('function')
    expect(typeof conversationEngine.requestClarification).toBe('function')
    expect(typeof conversationEngine.resolveClarification).toBe('function')
    expect(typeof conversationEngine.closeConversation).toBe('function')
    expect(typeof conversationEngine.buildConversationContext).toBe('function')
    expect(typeof conversationEngine.validateConversation).toBe('function')
    expect(typeof conversationEngine.validateConversationContext).toBe('function')
  })

  it('ensures conversationEngine is frozen and immutable', () => {
    expect(Object.isFrozen(conversationEngine)).toBe(true)

    expect(() => {
      conversationEngine.status = 'active'
    }).toThrow()

    expect(() => {
      conversationEngine.newProp = 'illegal'
    }).toThrow()
  })

  it('ensures conversationEngine exposes no unauthorized or operational AI methods', () => {
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
      expect(conversationEngine[method]).toBeUndefined()
    })

    expect(Object.keys(conversationEngine).sort()).toEqual([
      'appendMessage',
      'buildConversationContext',
      'closeConversation',
      'name',
      'requestClarification',
      'resolveClarification',
      'startConversation',
      'status',
      'updateTopic',
      'validateConversation',
      'validateConversationContext',
    ])
  })

  // Provider Layer 11B.3 Assertions
  it('ensures providerLayer has canonical name "provider-layer", status "ready", and approved interface functions', () => {
    expect(providerLayer).toBeDefined()
    expect(providerLayer.name).toBe('provider-layer')
    expect(providerLayer.status).toBe('ready')
    expect(typeof providerLayer.getProvider).toBe('function')
    expect(typeof providerLayer.getProviderDescriptor).toBe('function')
    expect(typeof providerLayer.listProviders).toBe('function')
    expect(typeof providerLayer.createProviderRequest).toBe('function')
    expect(typeof providerLayer.validateProviderRequest).toBe('function')
    expect(typeof providerLayer.validateProviderResponse).toBe('function')
    expect(typeof providerLayer.validateProviderDiagnostics).toBe('function')
  })

  it('ensures providerLayer is frozen and immutable', () => {
    expect(Object.isFrozen(providerLayer)).toBe(true)

    expect(() => {
      providerLayer.status = 'active'
    }).toThrow()

    expect(() => {
      providerLayer.newProp = 'illegal'
    }).toThrow()
  })

  it('ensures providerLayer exposes no unauthorized or operational AI execution methods directly', () => {
    const PROHIBITED_METHODS = [
      'execute',
      'generate',
      'chat',
      'stream',
      'complete',
      'send',
      'invoke',
      'orchestrate',
      'retry',
      'fallback',
    ]
    PROHIBITED_METHODS.forEach((method) => {
      expect(providerLayer[method]).toBeUndefined()
    })

    expect(Object.keys(providerLayer).sort()).toEqual([
      'createProviderRequest',
      'getProvider',
      'getProviderDescriptor',
      'listProviders',
      'name',
      'status',
      'validateProviderDiagnostics',
      'validateProviderRequest',
      'validateProviderResponse',
    ])
  })

  // AI Orchestrator 11B.4 Assertions
  it('ensures aiOrchestrator has canonical name "ai-orchestrator", status "ready", and approved interface functions', () => {
    expect(aiOrchestrator).toBeDefined()
    expect(aiOrchestrator.name).toBe('ai-orchestrator')
    expect(aiOrchestrator.status).toBe('ready')
    expect(typeof aiOrchestrator.executeWorkflow).toBe('function')
    expect(typeof aiOrchestrator.getWorkflowTemplate).toBe('function')
    expect(typeof aiOrchestrator.listWorkflowTemplates).toBe('function')
    expect(typeof aiOrchestrator.validateWorkflow).toBe('function')
    expect(typeof aiOrchestrator.validateWorkflowDiagnostics).toBe('function')
  })

  it('ensures aiOrchestrator is frozen and immutable', () => {
    expect(Object.isFrozen(aiOrchestrator)).toBe(true)

    expect(() => {
      aiOrchestrator.status = 'active'
    }).toThrow()

    expect(() => {
      aiOrchestrator.newProp = 'illegal'
    }).toThrow()
  })

  it('ensures aiOrchestrator exposes no unauthorized or operational AI execution methods directly', () => {
    const PROHIBITED_METHODS = [
      'generate',
      'chat',
      'stream',
      'complete',
      'send',
      'invoke',
      'retry',
      'fallback',
    ]
    PROHIBITED_METHODS.forEach((method) => {
      expect(aiOrchestrator[method]).toBeUndefined()
    })

    expect(Object.keys(aiOrchestrator).sort()).toEqual([
      'executeWorkflow',
      'getWorkflowTemplate',
      'listWorkflowTemplates',
      'name',
      'status',
      'validateWorkflow',
      'validateWorkflowDiagnostics',
    ])
  })

  // Preserved Placeholder Assertions for the remaining placeholder modules
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
