import { createServiceCoordinator } from '../orchestration/serviceCoordinator.js'
import { promptBuilder as defaultPromptBuilder } from '../prompt/promptBuilder.js'
import { memoryService as defaultMemoryService } from '../memory/memoryService.js'
import { guardrailEngine as defaultGuardrailEngine } from '../guardrails/guardrailEngine.js'
import {
  createAuditLogger,
  createInMemoryAuditSink,
} from '../guardrails/auditLogger.js'
import { WorkflowError } from '../orchestration/workflowErrors.js'
import { createMockProvider } from './providerMock.js'
import { createMockProviderLayer } from './providerMockLayer.js'
import {
  createDeterministicClock,
  createDeterministicTimer,
  createDeterministicIdGenerator,
} from './deterministicRuntime.js'

export function createWorkflowSimulator({
  provider = null,
  promptBuilder = defaultPromptBuilder,
  memoryService = defaultMemoryService,
  guardrailEngine = defaultGuardrailEngine,
  clock = createDeterministicClock(),
  timer = null,
  idGenerator = createDeterministicIdGenerator('wf-sim'),
  workflowTimeoutMs = 30000,
} = {}) {
  const activeTimer = timer || createDeterministicTimer(clock)
  const activeProvider = provider || createMockProvider()
  const mockProviderLayer = createMockProviderLayer(activeProvider)

  const auditSink = createInMemoryAuditSink()
  const auditLogger = createAuditLogger({
    writeEvent: (evt) => auditSink.writeEvent(evt),
    clock,
    idGenerator: createDeterministicIdGenerator('audit-sim'),
  })

  const coordinator = createServiceCoordinator({
    promptBuilder,
    providerLayer: mockProviderLayer,
    memoryService,
    guardrailEngine,
    auditLogger,
    clock,
    timer: activeTimer,
    idGenerator,
    workflowTimeoutMs,
  })

  async function runSync(input) {
    try {
      const result = await coordinator.executeWorkflow(input)
      return Object.freeze({
        workflow: result.workflow,
        response: result.response,
        error: null,
        events: Object.freeze([]),
        chunks: Object.freeze([]),
        streamDiagnostics: null,
        providerCalls: activeProvider.getCalls(),
        auditEvents: auditSink.getEvents(),
      })
    } catch (err) {
      if (err instanceof WorkflowError) {
        return Object.freeze({
          workflow: err.workflow || null,
          response: null,
          error: err,
          events: Object.freeze([]),
          chunks: Object.freeze([]),
          streamDiagnostics: null,
          providerCalls: activeProvider.getCalls(),
          auditEvents: auditSink.getEvents(),
        })
      }
      throw err
    }
  }

  async function runStreaming(input, { onChunk = null, onEvent = null, streamId = null, session = null } = {}) {
    const capturedChunks = []
    const capturedEvents = []

    const wrappedOnChunk = (chunk) => {
      capturedChunks.push(chunk)
      if (typeof onChunk === 'function') {
        onChunk(chunk)
      }
    }

    const wrappedOnEvent = (evt) => {
      capturedEvents.push(evt)
      if (typeof onEvent === 'function') {
        onEvent(evt)
      }
    }

    try {
      const result = await coordinator.executeStreamingWorkflow(input, {
        onChunk: wrappedOnChunk,
        onEvent: wrappedOnEvent,
        streamId,
        session,
      })

      return Object.freeze({
        workflow: result.workflow,
        response: result.response,
        error: null,
        events: Object.freeze([...capturedEvents]),
        chunks: Object.freeze([...capturedChunks]),
        streamDiagnostics: result.streamDiagnostics || null,
        providerCalls: activeProvider.getCalls(),
        auditEvents: auditSink.getEvents(),
      })
    } catch (err) {
      if (err instanceof WorkflowError) {
        return Object.freeze({
          workflow: err.workflow || null,
          response: null,
          error: err,
          events: Object.freeze([...capturedEvents]),
          chunks: Object.freeze([...capturedChunks]),
          streamDiagnostics: null,
          providerCalls: activeProvider.getCalls(),
          auditEvents: auditSink.getEvents(),
        })
      }
      throw err
    }
  }

  async function runScenario(scenario) {
    if (!scenario || typeof scenario !== 'object') {
      throw new Error('runScenario requires a scenario object.')
    }
    const mode = scenario.mode || 'sync'
    if (mode === 'stream') {
      return runStreaming(scenario.input, scenario.options || {})
    }
    return runSync(scenario.input)
  }

  return Object.freeze({
    runSync,
    runStreaming,
    runScenario,
    getCoordinator: () => coordinator,
    getProvider: () => activeProvider,
    getProviderLayer: () => mockProviderLayer,
    getClock: () => clock,
    getTimer: () => activeTimer,
    getAuditEvents: () => auditSink.getEvents(),
    clearAuditEvents: () => auditSink.clear(),
  })
}
