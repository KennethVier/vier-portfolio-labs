import { describe, expect, it, vi } from 'vitest'
import { aiOrchestrator } from './aiOrchestrator.js'
import {
  AI_WORKFLOW_VERSION,
  WORKFLOW_STATUSES,
  createWorkflow,
  validateWorkflow,
} from './aiWorkflow.js'
import {
  WORKFLOW_TEMPLATE_VERSION,
  getWorkflowTemplate,
  listWorkflowTemplates,
} from './workflowTemplates.js'
import {
  WORKFLOW_DIAGNOSTICS_VERSION,
  createWorkflowDiagnostics,
  validateWorkflowDiagnostics,
} from './workflowDiagnostics.js'
import {
  workflowManager,
} from './workflowManager.js'
import {
  WORKFLOW_ERROR_CODES,
  WorkflowError,
} from './workflowErrors.js'
import {
  retryManager,
  isRetryableProviderErrorCode,
} from './retryManager.js'
import { createServiceCoordinator } from './serviceCoordinator.js'
import { ProviderError, PROVIDER_ERROR_CODES } from '../providers/providerErrors.js'
import {
  createMemoryDto,
  createMemoryRecord,
  MEMORY_TYPES,
} from '../memory/memoryService.js'

describe('Phase 11B.4 — AI Orchestration Engine', () => {
  const sampleFinancialSummary = Object.freeze({
    netSavings: 5000,
    healthScore: 85,
    status: 'healthy',
  })

  const sampleInsightBundle = Object.freeze({
    insights: [{ id: 'health-1', type: 'health', severity: 'positive' }],
  })

  const sampleRecommendationBundle = Object.freeze({
    recommendations: [{ id: 'rec-1', priority: 'high', title: 'Save more' }],
  })

  const sampleConversationContext = Object.freeze({
    version: '1.0.0',
    topic: { current: 'savings' },
    clarification: { required: false, reason: null, missingFields: [] },
    recentMessages: [{ role: 'user', content: 'How are my savings?' }],
  })

  const sampleTemplate = Object.freeze({
    id: 'financial-summary-explanation',
    version: '1.0.0',
    task: 'financial-summary-explanation',
    promptTemplateId: 'financial-summary-explanation',
  })

  const sampleProviderConfig = Object.freeze({
    id: 'ollama',
    model: 'llama3.2',
  })

  // 1. AI Workflow DTO & Validation
  describe('AI Workflow DTO', () => {
    it('creates canonical frozen AIWorkflow DTO with status pending and attempt 0', () => {
      const wf = createWorkflow({
        workflowId: 'wf-123',
        template: sampleTemplate,
        provider: sampleProviderConfig,
      })

      expect(wf.version).toBe(AI_WORKFLOW_VERSION)
      expect(wf.workflowId).toBe('wf-123')
      expect(wf.template).toEqual({
        id: 'financial-summary-explanation',
        version: '1.0.0',
      })
      expect(wf.task).toBe('financial-summary-explanation')
      expect(wf.provider).toEqual({
        id: 'ollama',
        model: 'llama3.2',
      })
      expect(wf.status).toBe(WORKFLOW_STATUSES.PENDING)
      expect(wf.attempt).toBe(0)
      expect(wf.startedAt).toBeNull()
      expect(wf.completedAt).toBeNull()
      expect(wf.diagnostics).toBeNull()
      expect(Object.isFrozen(wf)).toBe(true)

      const validation = validateWorkflow(wf)
      expect(validation.valid).toBe(true)
      expect(validation.errors).toEqual([])
    })

    it('rejects forbidden keys such as raw prompts, provider requests, responses, or error objects', () => {
      const base = createWorkflow({
        workflowId: 'wf-123',
        template: sampleTemplate,
        provider: sampleProviderConfig,
      })

      const withPrompt = { ...base, promptPackage: {} }
      expect(validateWorkflow(withPrompt).valid).toBe(false)
      expect(validateWorkflow(withPrompt).errors[0]).toContain('must not contain "promptPackage"')

      const withResponse = { ...base, providerResponse: {} }
      expect(validateWorkflow(withResponse).valid).toBe(false)

      const withError = { ...base, error: { message: 'err' } }
      expect(validateWorkflow(withError).valid).toBe(false)
    })

    it('validates attempt limits between 0 and 2', () => {
      const base = createWorkflow({
        workflowId: 'wf-123',
        template: sampleTemplate,
        provider: sampleProviderConfig,
      })

      const invalidAttempt = { ...base, status: WORKFLOW_STATUSES.RUNNING, attempt: 3 }
      const validation = validateWorkflow(invalidAttempt)
      expect(validation.valid).toBe(false)
      expect(validation.errors[0]).toContain('attempt must be an integer between 0 and 2')
    })
  })

  // 2. Workflow Lifecycle & State Transitions
  describe('Workflow Lifecycle & State Transitions', () => {
    it('executes valid pending -> running -> succeeded transition', () => {
      const wf0 = workflowManager.createWorkflow({
        workflowId: 'wf-100',
        template: sampleTemplate,
        provider: sampleProviderConfig,
      })
      expect(wf0.status).toBe(WORKFLOW_STATUSES.PENDING)
      expect(wf0.attempt).toBe(0)

      const startedAt = '2026-10-04T12:00:00.000Z'
      const wf1 = workflowManager.startWorkflow(wf0, { startedAt })
      expect(wf1.status).toBe(WORKFLOW_STATUSES.RUNNING)
      expect(wf1.attempt).toBe(1)
      expect(wf1.startedAt).toBe(startedAt)

      const completedAt = '2026-10-04T12:00:01.000Z'
      const diag = createWorkflowDiagnostics({
        workflowId: 'wf-100',
        templateId: sampleTemplate.id,
        providerId: 'ollama',
        model: 'llama3.2',
        status: 'succeeded',
        attempts: 1,
        durationMs: 1000,
      })

      const wf2 = workflowManager.completeWorkflow(wf1, { completedAt, diagnostics: diag })
      expect(wf2.status).toBe(WORKFLOW_STATUSES.SUCCEEDED)
      expect(wf2.attempt).toBe(1)
      expect(wf2.completedAt).toBe(completedAt)
      expect(wf2.diagnostics).toEqual(diag)
    })

    it('executes valid running -> running (attempt increment) -> failed transition', () => {
      const wf0 = workflowManager.createWorkflow({
        workflowId: 'wf-101',
        template: sampleTemplate,
        provider: sampleProviderConfig,
      })
      const wf1 = workflowManager.startWorkflow(wf0, { startedAt: '2026-10-04T12:00:00.000Z' })
      expect(wf1.attempt).toBe(1)

      const wf2 = workflowManager.incrementAttempt(wf1)
      expect(wf2.status).toBe(WORKFLOW_STATUSES.RUNNING)
      expect(wf2.attempt).toBe(2)

      const diag = createWorkflowDiagnostics({
        workflowId: 'wf-101',
        templateId: sampleTemplate.id,
        providerId: 'ollama',
        model: 'llama3.2',
        status: 'failed',
        attempts: 2,
        durationMs: 2500,
        finalErrorCode: 'PROVIDER_UNAVAILABLE',
      })

      const wf3 = workflowManager.failWorkflow(wf2, {
        completedAt: '2026-10-04T12:00:02.500Z',
        diagnostics: diag,
      })
      expect(wf3.status).toBe(WORKFLOW_STATUSES.FAILED)
      expect(wf3.attempt).toBe(2)
      expect(wf3.diagnostics.finalErrorCode).toBe('PROVIDER_UNAVAILABLE')
    })

    it('executes valid running -> timed_out transition', () => {
      const wf0 = workflowManager.createWorkflow({
        workflowId: 'wf-102',
        template: sampleTemplate,
        provider: sampleProviderConfig,
      })
      const wf1 = workflowManager.startWorkflow(wf0, { startedAt: '2026-10-04T12:00:00.000Z' })

      const diag = createWorkflowDiagnostics({
        workflowId: 'wf-102',
        templateId: sampleTemplate.id,
        providerId: 'ollama',
        model: 'llama3.2',
        status: 'timed_out',
        attempts: 1,
        durationMs: 45000,
        finalErrorCode: 'WORKFLOW_TIMEOUT',
      })

      const wfTimedOut = workflowManager.timeoutWorkflow(wf1, {
        completedAt: '2026-10-04T12:00:45.000Z',
        diagnostics: diag,
      })
      expect(wfTimedOut.status).toBe(WORKFLOW_STATUSES.TIMED_OUT)
      expect(wfTimedOut.diagnostics.status).toBe('timed_out')
    })

    it('rejects invalid transitions with WorkflowError and code INVALID_WORKFLOW_STATE', () => {
      const wf0 = workflowManager.createWorkflow({
        workflowId: 'wf-103',
        template: sampleTemplate,
        provider: sampleProviderConfig,
      })

      // Cannot complete or timeout or increment from pending
      expect(() => workflowManager.completeWorkflow(wf0, { completedAt: 'iso' })).toThrowError(
        expect.objectContaining({ code: WORKFLOW_ERROR_CODES.INVALID_WORKFLOW_STATE }),
      )
      expect(() => workflowManager.timeoutWorkflow(wf0, { completedAt: 'iso' })).toThrowError(
        expect.objectContaining({ code: WORKFLOW_ERROR_CODES.INVALID_WORKFLOW_STATE }),
      )
      expect(() => workflowManager.incrementAttempt(wf0)).toThrowError(
        expect.objectContaining({ code: WORKFLOW_ERROR_CODES.INVALID_WORKFLOW_STATE }),
      )

      // Start workflow
      const wfRunning = workflowManager.startWorkflow(wf0, { startedAt: 'iso' })

      // Cannot increment beyond attempt 2
      const wfAttempt2 = workflowManager.incrementAttempt(wfRunning)
      expect(() => workflowManager.incrementAttempt(wfAttempt2)).toThrowError(
        expect.objectContaining({ code: WORKFLOW_ERROR_CODES.INVALID_WORKFLOW_STATE }),
      )

      // Cannot transition from terminal succeeded state
      const wfSucceeded = workflowManager.completeWorkflow(wfAttempt2, { completedAt: 'iso' })
      expect(() => workflowManager.startWorkflow(wfSucceeded, { startedAt: 'iso' })).toThrowError(
        expect.objectContaining({ code: WORKFLOW_ERROR_CODES.INVALID_WORKFLOW_STATE }),
      )
      expect(() => workflowManager.failWorkflow(wfSucceeded, { completedAt: 'iso' })).toThrowError(
        expect.objectContaining({ code: WORKFLOW_ERROR_CODES.INVALID_WORKFLOW_STATE }),
      )
    })
  })

  // 3. Workflow Template Registry
  describe('Workflow Template Registry', () => {
    it('registers only financial-summary-explanation and is frozen', () => {
      const templates = listWorkflowTemplates()
      expect(templates).toHaveLength(1)
      expect(templates[0].id).toBe('financial-summary-explanation')
      expect(templates[0].version).toBe(WORKFLOW_TEMPLATE_VERSION)
      expect(templates[0].task).toBe('financial-summary-explanation')
      expect(templates[0].promptTemplateId).toBe('financial-summary-explanation')

      expect(Object.isFrozen(templates)).toBe(true)
      expect(Object.isFrozen(templates[0])).toBe(true)
    })

    it('resolves financial-summary-explanation and rejects unknown template ID', () => {
      const t = getWorkflowTemplate('financial-summary-explanation')
      expect(t.id).toBe('financial-summary-explanation')

      expect(() => getWorkflowTemplate('speculative-workflow')).toThrowError(
        expect.objectContaining({
          code: WORKFLOW_ERROR_CODES.UNKNOWN_WORKFLOW_TEMPLATE,
        }),
      )
      expect(() => getWorkflowTemplate('')).toThrowError(
        expect.objectContaining({
          code: WORKFLOW_ERROR_CODES.UNKNOWN_WORKFLOW_TEMPLATE,
        }),
      )
    })

    it('ensures template is provider-independent (no ollama, baseUrl, or timeouts)', () => {
      const t = getWorkflowTemplate('financial-summary-explanation')
      expect(t.provider).toBeUndefined()
      expect(t.model).toBeUndefined()
      expect(t.baseUrl).toBeUndefined()
      expect(t.timeoutMs).toBeUndefined()
    })
  })

  // 4. Retry Manager & Error Retryability Matrix
  describe('Retry Manager & Matrix', () => {
    it('correctly classifies retryable vs non-retryable provider error codes', () => {
      const retryableCodes = [
        PROVIDER_ERROR_CODES.PROVIDER_UNAVAILABLE,
        PROVIDER_ERROR_CODES.TRANSPORT_TIMEOUT,
        PROVIDER_ERROR_CODES.TRANSPORT_ERROR,
      ]

      const nonRetryableCodes = [
        PROVIDER_ERROR_CODES.INVALID_REQUEST,
        PROVIDER_ERROR_CODES.UNKNOWN_PROVIDER,
        PROVIDER_ERROR_CODES.INVALID_PROVIDER_CONFIG,
        PROVIDER_ERROR_CODES.INSECURE_ENDPOINT_REJECTED,
        PROVIDER_ERROR_CODES.MODEL_NOT_FOUND,
        PROVIDER_ERROR_CODES.REMOTE_MODEL_REJECTED,
        PROVIDER_ERROR_CODES.UNKNOWN_LOCALITY_REJECTED,
        PROVIDER_ERROR_CODES.INVALID_PROVIDER_RESPONSE,
        PROVIDER_ERROR_CODES.PROVIDER_REJECTED_REQUEST,
      ]

      retryableCodes.forEach((code) => {
        expect(isRetryableProviderErrorCode(code)).toBe(true)
        expect(
          retryManager.shouldRetry({
            attempt: 1,
            error: { code },
            isWorkflowAborted: false,
            remainingMs: 10000,
          }),
        ).toBe(true)
      })

      nonRetryableCodes.forEach((code) => {
        expect(isRetryableProviderErrorCode(code)).toBe(false)
        expect(
          retryManager.shouldRetry({
            attempt: 1,
            error: { code },
            isWorkflowAborted: false,
            remainingMs: 10000,
          }),
        ).toBe(false)
      })
    })

    it('strictly forbids retry when max attempts (2) are reached or deadline has elapsed', () => {
      expect(
        retryManager.shouldRetry({
          attempt: 2,
          error: { code: PROVIDER_ERROR_CODES.PROVIDER_UNAVAILABLE },
          isWorkflowAborted: false,
          remainingMs: 10000,
        }),
      ).toBe(false)

      expect(
        retryManager.shouldRetry({
          attempt: 1,
          error: { code: PROVIDER_ERROR_CODES.PROVIDER_UNAVAILABLE },
          isWorkflowAborted: false,
          remainingMs: 0,
        }),
      ).toBe(false)
    })

    it('enforces precedence: master workflow abort supersedes retryable error', () => {
      expect(
        retryManager.shouldRetry({
          attempt: 1,
          error: { code: PROVIDER_ERROR_CODES.TRANSPORT_TIMEOUT },
          isWorkflowAborted: true, // Master workflow signal aborted!
          remainingMs: 10000,
        }),
      ).toBe(false)
    })
  })

  // 5. Service Coordinator - Happy Path & Input Boundaries
  describe('Service Coordinator - Execution', () => {
    function createMockDependencies({
      mockGenerate = vi.fn().mockResolvedValue({
        version: '1.0.0',
        providerId: 'ollama',
        model: 'llama3.2',
        content: 'Your financial health is strong with net savings of P5,000.',
        finishReason: 'stop',
        diagnostics: {
          version: '1.0.0',
          providerId: 'ollama',
          model: 'llama3.2',
          totalDurationNs: 1000000,
          loadDurationNs: 100000,
          promptEvalCount: 10,
          evalCount: 20,
        },
      }),
      clockNow = 1700000000000,
    } = {}) {
      let currentNow = clockNow

      const mockClock = {
        nowMs: vi.fn(() => currentNow),
      }

      const advanceTime = (ms) => {
        currentNow += ms
      }

      const mockTimer = {
        setTimeout: vi.fn((fn, ms) => {
          return { id: 1, fn, ms }
        }),
        clearTimeout: vi.fn(),
      }

      const mockPromptBuilder = {
        build: vi.fn().mockReturnValue({
          version: '1.0.0',
          systemPrompt: 'System instructions',
          userPrompt: 'Financial context',
          template: { id: 'financial-summary-explanation', version: '1.0.0' },
          task: 'financial-summary-explanation',
          context: {},
        }),
      }

      const mockAdapter = {
        id: 'ollama',
        locality: 'local',
        generate: mockGenerate,
      }

      const mockProviderLayer = {
        getProvider: vi.fn().mockReturnValue(mockAdapter),
        createProviderRequest: vi.fn().mockReturnValue({
          version: '1.0.0',
          providerId: 'ollama',
          model: 'llama3.2',
          prompt: { system: 'System instructions', user: 'Financial context' },
          generation: { stream: false },
        }),
        validateProviderResponse: vi.fn().mockReturnValue({ valid: true, errors: [] }),
      }

      const coordinator = createServiceCoordinator({
        promptBuilder: mockPromptBuilder,
        providerLayer: mockProviderLayer,
        clock: mockClock,
        timer: mockTimer,
        idGenerator: () => 'wf-test-id-123',
        workflowTimeoutMs: 45000,
      })

      return {
        coordinator,
        mockPromptBuilder,
        mockProviderLayer,
        mockAdapter,
        mockClock,
        mockTimer,
        advanceTime,
      }
    }

    it('executes successful workflow and returns { workflow, response }', async () => {
      const { coordinator, mockPromptBuilder, mockAdapter, advanceTime } =
        createMockDependencies()

      const input = {
        workflowId: 'wf-custom-1',
        templateId: 'financial-summary-explanation',
        insightBundle: sampleInsightBundle,
        recommendationBundle: sampleRecommendationBundle,
        financialSummary: sampleFinancialSummary,
        conversationContext: sampleConversationContext,
        provider: {
          id: 'ollama',
          model: 'llama3.2',
          config: { baseUrl: 'http://127.0.0.1:11434' },
        },
      }

      advanceTime(500)
      const result = await coordinator.executeWorkflow(input)

      expect(result).toBeDefined()
      expect(result.workflow).toBeDefined()
      expect(result.response).toBeDefined()

      // Verify workflow state
      expect(result.workflow.workflowId).toBe('wf-custom-1')
      expect(result.workflow.status).toBe(WORKFLOW_STATUSES.SUCCEEDED)
      expect(result.workflow.attempt).toBe(1)
      expect(result.workflow.diagnostics).toBeDefined()
      expect(result.workflow.diagnostics.status).toBe('succeeded')
      expect(result.workflow.diagnostics.attempts).toBe(1)

      // Verify response
      expect(result.response.content).toContain('net savings of P5,000')

      // Verify prompt builder was invoked with correct arguments
      expect(mockPromptBuilder.build).toHaveBeenCalledTimes(1)
      expect(mockPromptBuilder.build).toHaveBeenCalledWith({
        insightBundle: sampleInsightBundle,
        recommendationBundle: sampleRecommendationBundle,
        financialSummary: sampleFinancialSummary,
        conversationContext: sampleConversationContext,
        memoryContext: null,
        templateId: 'financial-summary-explanation',
      })

      // Verify adapter was called once with signal forwarded
      expect(mockAdapter.generate).toHaveBeenCalledTimes(1)
      const passedConfig = mockAdapter.generate.mock.calls[0][1]
      expect(passedConfig.signal).toBeDefined()
      expect(passedConfig.baseUrl).toBe('http://127.0.0.1:11434')
    })

    it('does not mutate or alter source deterministic financial bundles (graceful degradation boundary)', async () => {
      const { coordinator } = createMockDependencies()

      const originalSummarySnapshot = JSON.stringify(sampleFinancialSummary)
      const originalInsightSnapshot = JSON.stringify(sampleInsightBundle)
      const originalRecSnapshot = JSON.stringify(sampleRecommendationBundle)

      await coordinator.executeWorkflow({
        templateId: 'financial-summary-explanation',
        insightBundle: sampleInsightBundle,
        recommendationBundle: sampleRecommendationBundle,
        financialSummary: sampleFinancialSummary,
        provider: { model: 'llama3.2' },
      })

      expect(JSON.stringify(sampleFinancialSummary)).toBe(originalSummarySnapshot)
      expect(JSON.stringify(sampleInsightBundle)).toBe(originalInsightSnapshot)
      expect(JSON.stringify(sampleRecommendationBundle)).toBe(originalRecSnapshot)
    })

    it('rejects invalid orchestration input with INVALID_ORCHESTRATION_INPUT before creating workflow', async () => {
      const { coordinator } = createMockDependencies()

      await expect(coordinator.executeWorkflow(null)).rejects.toThrowError(
        expect.objectContaining({ code: WORKFLOW_ERROR_CODES.INVALID_ORCHESTRATION_INPUT }),
      )

      await expect(
        coordinator.executeWorkflow({
          templateId: '',
          insightBundle: sampleInsightBundle,
          recommendationBundle: sampleRecommendationBundle,
          financialSummary: sampleFinancialSummary,
          provider: { model: 'llama3.2' },
        }),
      ).rejects.toThrowError(
        expect.objectContaining({ code: WORKFLOW_ERROR_CODES.INVALID_ORCHESTRATION_INPUT }),
      )

      await expect(
        coordinator.executeWorkflow({
          templateId: 'financial-summary-explanation',
          insightBundle: null,
          recommendationBundle: sampleRecommendationBundle,
          financialSummary: sampleFinancialSummary,
          provider: { model: 'llama3.2' },
        }),
      ).rejects.toThrowError(
        expect.objectContaining({ code: WORKFLOW_ERROR_CODES.INVALID_ORCHESTRATION_INPUT }),
      )
    })
  })

  // 6. Timeout, Cancellation & Precedence
  describe('Timeout, Cancellation & Precedence', () => {
    it('aborts active provider request and sets status timed_out when workflow deadline expires', async () => {
      let capturedSignal = null
      const mockGenerate = vi.fn().mockImplementation((req, config) => {
        capturedSignal = config.signal
        return new Promise((_, reject) => {
          config.signal.addEventListener('abort', () => {
            const err = new ProviderError({
              code: PROVIDER_ERROR_CODES.TRANSPORT_TIMEOUT,
              message: 'Transport request timed out.',
            })
            reject(err)
          })
        })
      })

      let currentNow = 1700000000000
      let timerCallback = null
      const mockClock = { nowMs: () => currentNow }
      const mockTimer = {
        setTimeout: vi.fn((fn) => {
          timerCallback = fn
          return { id: 1 }
        }),
        clearTimeout: vi.fn(),
      }

      const mockAdapter = { id: 'ollama', locality: 'local', generate: mockGenerate }
      const mockProviderLayer = {
        getProvider: vi.fn().mockReturnValue(mockAdapter),
        createProviderRequest: vi.fn().mockReturnValue({}),
        validateProviderResponse: vi.fn().mockReturnValue({ valid: true, errors: [] }),
      }

      const mockPromptBuilder = {
        build: vi.fn().mockReturnValue({
          systemPrompt: 'sys',
          userPrompt: 'usr',
          template: { id: 't' },
        }),
      }

      const coordinator = createServiceCoordinator({
        promptBuilder: mockPromptBuilder,
        providerLayer: mockProviderLayer,
        clock: mockClock,
        timer: mockTimer,
        workflowTimeoutMs: 45000,
      })

      const execPromise = coordinator.executeWorkflow({
        templateId: 'financial-summary-explanation',
        insightBundle: sampleInsightBundle,
        recommendationBundle: sampleRecommendationBundle,
        financialSummary: sampleFinancialSummary,
        provider: { model: 'llama3.2' },
      })

      // Simulate timer expiration firing master abort
      currentNow += 45001
      timerCallback()

      await expect(execPromise).rejects.toThrowError(
        expect.objectContaining({
          code: WORKFLOW_ERROR_CODES.WORKFLOW_TIMEOUT,
        }),
      )

      expect(capturedSignal.aborted).toBe(true)
    })

    it('enforces precedence: when provider surfaces TRANSPORT_TIMEOUT and workflow signal is aborted, no retry occurs', async () => {
      let invocations = 0
      let timerCallback = null
      const mockTimer = {
        setTimeout: vi.fn((fn) => {
          timerCallback = fn
          return 1
        }),
        clearTimeout: vi.fn(),
      }

      const mockGenerate = vi.fn().mockImplementation(() => {
        invocations++
        if (timerCallback) {
          timerCallback()
        }
        return Promise.reject(
          new ProviderError({
            code: PROVIDER_ERROR_CODES.TRANSPORT_TIMEOUT,
            message: 'Low-level timeout',
          }),
        )
      })

      const coordinator = createServiceCoordinator({
        promptBuilder: { build: vi.fn().mockReturnValue({ template: {} }) },
        providerLayer: {
          getProvider: () => ({ id: 'ollama', locality: 'local', generate: mockGenerate }),
          createProviderRequest: () => ({}),
          validateProviderResponse: () => ({ valid: true }),
        },
        clock: { nowMs: () => 1700000000000 },
        timer: mockTimer,
        workflowTimeoutMs: 45000,
      })

      await expect(
        coordinator.executeWorkflow({
          templateId: 'financial-summary-explanation',
          insightBundle: sampleInsightBundle,
          recommendationBundle: sampleRecommendationBundle,
          financialSummary: sampleFinancialSummary,
          provider: { model: 'llama3.2' },
        }),
      ).rejects.toThrowError(
        expect.objectContaining({
          code: WORKFLOW_ERROR_CODES.WORKFLOW_TIMEOUT,
        }),
      )

      // Only attempt 1 ran before abort was detected; attempt 2 was NEVER scheduled
      expect(invocations).toBe(1)
    })
  })

  // 7. Retry Behavior: Success, Exhaustion, Non-Retryable
  describe('Retry Behavior', () => {
    it('retries once on retryable error and succeeds on second attempt', async () => {
      let callCount = 0
      const mockGenerate = vi.fn().mockImplementation(async () => {
        callCount++
        if (callCount === 1) {
          throw new ProviderError({
            code: PROVIDER_ERROR_CODES.PROVIDER_UNAVAILABLE,
            message: 'Ollama is starting up.',
          })
        }
        return {
          version: '1.0.0',
          providerId: 'ollama',
          model: 'llama3.2',
          content: 'Explanation after retry.',
          finishReason: 'stop',
          diagnostics: { version: '1.0.0' },
        }
      })

      const coordinator = createServiceCoordinator({
        promptBuilder: { build: vi.fn().mockReturnValue({ template: {} }) },
        providerLayer: {
          getProvider: () => ({ id: 'ollama', locality: 'local', generate: mockGenerate }),
          createProviderRequest: () => ({}),
          validateProviderResponse: () => ({ valid: true, errors: [] }),
        },
        clock: { nowMs: () => 1700000000000 },
        timer: { setTimeout: vi.fn(() => 1), clearTimeout: vi.fn() },
      })

      const result = await coordinator.executeWorkflow({
        templateId: 'financial-summary-explanation',
        insightBundle: sampleInsightBundle,
        recommendationBundle: sampleRecommendationBundle,
        financialSummary: sampleFinancialSummary,
        provider: { model: 'llama3.2' },
      })

      expect(callCount).toBe(2)
      expect(result.workflow.status).toBe(WORKFLOW_STATUSES.SUCCEEDED)
      expect(result.workflow.attempt).toBe(2)
      expect(result.workflow.diagnostics.attempts).toBe(2)
      expect(result.response.content).toBe('Explanation after retry.')
    })

    it('terminates with RETRIES_EXHAUSTED after 2 failed retryable attempts', async () => {
      let callCount = 0
      const mockGenerate = vi.fn().mockImplementation(async () => {
        callCount++
        throw new ProviderError({
          code: PROVIDER_ERROR_CODES.PROVIDER_UNAVAILABLE,
          message: 'Connection refused repeatedly.',
        })
      })

      const coordinator = createServiceCoordinator({
        promptBuilder: { build: vi.fn().mockReturnValue({ template: {} }) },
        providerLayer: {
          getProvider: () => ({ id: 'ollama', locality: 'local', generate: mockGenerate }),
          createProviderRequest: () => ({}),
          validateProviderResponse: () => ({ valid: true }),
        },
        clock: { nowMs: () => 1700000000000 },
        timer: { setTimeout: vi.fn(() => 1), clearTimeout: vi.fn() },
      })

      try {
        await coordinator.executeWorkflow({
          templateId: 'financial-summary-explanation',
          insightBundle: sampleInsightBundle,
          recommendationBundle: sampleRecommendationBundle,
          financialSummary: sampleFinancialSummary,
          provider: { model: 'llama3.2' },
        })
        expect.unreachable()
      } catch (err) {
        expect(err).toBeInstanceOf(WorkflowError)
        expect(err.code).toBe(WORKFLOW_ERROR_CODES.RETRIES_EXHAUSTED)
        expect(err.workflow.status).toBe(WORKFLOW_STATUSES.FAILED)
        expect(err.workflow.attempt).toBe(2)
        expect(err.diagnostics.attempts).toBe(2)
        expect(err.diagnostics.finalErrorCode).toBe(WORKFLOW_ERROR_CODES.RETRIES_EXHAUSTED)
      }

      expect(callCount).toBe(2)
    })

    it('does not retry non-retryable error (e.g. MODEL_NOT_FOUND or REMOTE_MODEL_REJECTED)', async () => {
      let callCount = 0
      const mockGenerate = vi.fn().mockImplementation(async () => {
        callCount++
        throw new ProviderError({
          code: PROVIDER_ERROR_CODES.MODEL_NOT_FOUND,
          message: 'Model was not found in Ollama.',
        })
      })

      const coordinator = createServiceCoordinator({
        promptBuilder: { build: vi.fn().mockReturnValue({ template: {} }) },
        providerLayer: {
          getProvider: () => ({ id: 'ollama', locality: 'local', generate: mockGenerate }),
          createProviderRequest: () => ({}),
          validateProviderResponse: () => ({ valid: true }),
        },
        clock: { nowMs: () => 1700000000000 },
        timer: { setTimeout: vi.fn(() => 1), clearTimeout: vi.fn() },
      })

      try {
        await coordinator.executeWorkflow({
          templateId: 'financial-summary-explanation',
          insightBundle: sampleInsightBundle,
          recommendationBundle: sampleRecommendationBundle,
          financialSummary: sampleFinancialSummary,
          provider: { model: 'llama3.2' },
        })
        expect.unreachable()
      } catch (err) {
        expect(err).toBeInstanceOf(WorkflowError)
        expect(err.code).toBe(WORKFLOW_ERROR_CODES.PROVIDER_EXECUTION_FAILED)
        expect(err.workflow.status).toBe(WORKFLOW_STATUSES.FAILED)
        expect(err.workflow.attempt).toBe(1)
        expect(err.diagnostics.attempts).toBe(1)
      }

      // Exactly 1 invocation! No retry!
      expect(callCount).toBe(1)
    })
  })

  // 8. Workflow Diagnostics & Privacy
  describe('Workflow Diagnostics & Privacy', () => {
    it('creates privacy-safe diagnostics without prompt, response content, or financial context', () => {
      const diag = createWorkflowDiagnostics({
        workflowId: 'wf-priv-1',
        templateId: 'financial-summary-explanation',
        providerId: 'ollama',
        model: 'llama3.2',
        status: 'succeeded',
        attempts: 1,
        durationMs: 42,
        finalErrorCode: null,
      })

      expect(diag.version).toBe(WORKFLOW_DIAGNOSTICS_VERSION)
      expect(diag.workflowId).toBe('wf-priv-1')
      expect(diag.templateId).toBe('financial-summary-explanation')
      expect(diag.providerId).toBe('ollama')
      expect(diag.model).toBe('llama3.2')
      expect(diag.status).toBe('succeeded')
      expect(diag.attempts).toBe(1)
      expect(diag.durationMs).toBe(42)
      expect(diag.finalErrorCode).toBeNull()

      // Prohibited private data
      expect(diag.prompt).toBeUndefined()
      expect(diag.systemPrompt).toBeUndefined()
      expect(diag.userPrompt).toBeUndefined()
      expect(diag.content).toBeUndefined()
      expect(diag.response).toBeUndefined()
      expect(diag.netSavings).toBeUndefined()
      expect(diag.error).toBeUndefined()
      expect(diag.cause).toBeUndefined()

      const validation = validateWorkflowDiagnostics(diag)
      expect(validation.valid).toBe(true)
      expect(validation.errors).toEqual([])
    })

    it('ensures WorkflowError does not retain arbitrary cause object or raw prompt data', () => {
      const err = new WorkflowError({
        code: WORKFLOW_ERROR_CODES.PROVIDER_EXECUTION_FAILED,
        message: 'Sanitized error message',
        workflowId: 'wf-1',
        templateId: 't-1',
        providerId: 'ollama',
        model: 'llama3.2',
      })

      expect(err.name).toBe('WorkflowError')
      expect(err.code).toBe(WORKFLOW_ERROR_CODES.PROVIDER_EXECUTION_FAILED)
      expect(err.message).toBe('Sanitized error message')
      expect(err.cause).toBeUndefined()
      expect(err.promptPackage).toBeUndefined()
      expect(err.providerRequest).toBeUndefined()
      expect(err.providerResponse).toBeUndefined()
    })
  })

  // 9. aiOrchestrator Facade
  describe('aiOrchestrator Facade', () => {
    it('exposes approved ready facade with public functions and no unauthorized operational methods', () => {
      expect(aiOrchestrator.name).toBe('ai-orchestrator')
      expect(aiOrchestrator.status).toBe('ready')
      expect(typeof aiOrchestrator.executeWorkflow).toBe('function')
      expect(typeof aiOrchestrator.getWorkflowTemplate).toBe('function')
      expect(typeof aiOrchestrator.listWorkflowTemplates).toBe('function')
      expect(typeof aiOrchestrator.validateWorkflow).toBe('function')
      expect(typeof aiOrchestrator.validateWorkflowDiagnostics).toBe('function')

      // Prohibited methods
      expect(aiOrchestrator.generate).toBeUndefined()
      expect(aiOrchestrator.chat).toBeUndefined()
      expect(aiOrchestrator.stream).toBeUndefined()
      expect(aiOrchestrator.complete).toBeUndefined()
      expect(aiOrchestrator.send).toBeUndefined()
      expect(aiOrchestrator.invoke).toBeUndefined()
      expect(aiOrchestrator.retry).toBeUndefined()
      expect(aiOrchestrator.fallback).toBeUndefined()

      expect(Object.isFrozen(aiOrchestrator)).toBe(true)
      expect(() => {
        aiOrchestrator.newProp = 'illegal'
      }).toThrow()
    })
  })

  // 10. AI Orchestrator Memory Integration (Phase 11B.5)
  describe('AI Orchestrator Memory Integration (Phase 11B.5)', () => {
    const validCandidate = {
      type: MEMORY_TYPES.communicationPreference,
      content: 'Prefers bulleted summaries.',
      topics: ['expenses'],
      workflowTypes: ['financial-summary-explanation'],
      explicitlyConfirmed: true,
      importance: 'medium',
      source: { type: 'user', referenceId: null },
    }

    const testRecord = createMemoryRecord({
      candidate: validCandidate,
      memoryId: 'mem-orch-1',
      createdAt: '2026-10-05T00:00:00.000Z',
    })

    const testMemoryDto = createMemoryDto({ records: [testRecord] })

    it('does not invoke retrieveContext when memoryState is absent/null', async () => {
      const mockPromptBuilder = {
        build: vi.fn().mockReturnValue({ template: {} }),
      }
      const mockMemoryService = {
        retrieveContext: vi.fn(),
        validateMemoryDto: vi.fn().mockReturnValue({ valid: true, errors: [] }),
      }

      const coordinator = createServiceCoordinator({
        promptBuilder: mockPromptBuilder,
        memoryService: mockMemoryService,
        providerLayer: {
          getProvider: () => ({ id: 'ollama', locality: 'local', generate: vi.fn().mockResolvedValue({ content: 'OK' }) }),
          createProviderRequest: () => ({}),
          validateProviderResponse: () => ({ valid: true }),
        },
        clock: { nowMs: () => 1700000000000 },
        timer: { setTimeout: vi.fn(), clearTimeout: vi.fn() },
      })

      await coordinator.executeWorkflow({
        templateId: 'financial-summary-explanation',
        insightBundle: sampleInsightBundle,
        recommendationBundle: sampleRecommendationBundle,
        financialSummary: sampleFinancialSummary,
        provider: { model: 'llama3.2' },
      })

      expect(mockMemoryService.retrieveContext).not.toHaveBeenCalled()
      expect(mockPromptBuilder.build).toHaveBeenCalledWith(
        expect.objectContaining({
          memoryContext: null,
        }),
      )
    })

    it('invokes retrieveContext and passes memoryContext to promptBuilder when memoryState is supplied', async () => {
      const mockPromptBuilder = {
        build: vi.fn().mockReturnValue({ template: {} }),
      }
      const expectedMemContext = {
        version: '1.0.0',
        items: [{ type: 'communication_preference', content: 'Prefers bulleted summaries.' }],
      }
      const mockMemoryService = {
        retrieveContext: vi.fn().mockReturnValue(expectedMemContext),
        validateMemoryDto: vi.fn().mockReturnValue({ valid: true, errors: [] }),
      }

      const coordinator = createServiceCoordinator({
        promptBuilder: mockPromptBuilder,
        memoryService: mockMemoryService,
        providerLayer: {
          getProvider: () => ({ id: 'ollama', locality: 'local', generate: vi.fn().mockResolvedValue({ content: 'OK' }) }),
          createProviderRequest: () => ({}),
          validateProviderResponse: () => ({ valid: true }),
        },
        clock: { nowMs: () => 1700000000000 },
        timer: { setTimeout: vi.fn(), clearTimeout: vi.fn() },
      })

      const convContext = {
        version: '1.0.0',
        topic: { current: 'expenses' },
        clarification: { required: false, reason: null, missingFields: [] },
        recentMessages: [],
      }

      await coordinator.executeWorkflow({
        templateId: 'financial-summary-explanation',
        insightBundle: sampleInsightBundle,
        recommendationBundle: sampleRecommendationBundle,
        financialSummary: sampleFinancialSummary,
        conversationContext: convContext,
        memoryState: testMemoryDto,
        provider: { model: 'llama3.2' },
      })

      expect(mockMemoryService.retrieveContext).toHaveBeenCalledWith({
        memoryDto: testMemoryDto,
        query: {
          workflowType: 'financial-summary-explanation',
          topic: 'expenses',
        },
      })

      expect(mockPromptBuilder.build).toHaveBeenCalledWith(
        expect.objectContaining({
          memoryContext: expectedMemContext,
        }),
      )
    })

    it('defaults query topic to "general" if conversationContext is omitted', async () => {
      const mockPromptBuilder = {
        build: vi.fn().mockReturnValue({ template: {} }),
      }
      const mockMemoryService = {
        retrieveContext: vi.fn().mockReturnValue(null),
        validateMemoryDto: vi.fn().mockReturnValue({ valid: true, errors: [] }),
      }

      const coordinator = createServiceCoordinator({
        promptBuilder: mockPromptBuilder,
        memoryService: mockMemoryService,
        providerLayer: {
          getProvider: () => ({ id: 'ollama', locality: 'local', generate: vi.fn().mockResolvedValue({ content: 'OK' }) }),
          createProviderRequest: () => ({}),
          validateProviderResponse: () => ({ valid: true }),
        },
        clock: { nowMs: () => 1700000000000 },
        timer: { setTimeout: vi.fn(), clearTimeout: vi.fn() },
      })

      await coordinator.executeWorkflow({
        templateId: 'financial-summary-explanation',
        insightBundle: sampleInsightBundle,
        recommendationBundle: sampleRecommendationBundle,
        financialSummary: sampleFinancialSummary,
        memoryState: testMemoryDto,
        provider: { model: 'llama3.2' },
      })

      expect(mockMemoryService.retrieveContext).toHaveBeenCalledWith({
        memoryDto: testMemoryDto,
        query: {
          workflowType: 'financial-summary-explanation',
          topic: 'general',
        },
      })
    })

    it('rejects unsupported memory aliases (e.g. memory, memoryDto, memories)', async () => {
      const coordinator = createServiceCoordinator({
        promptBuilder: { build: vi.fn() },
        providerLayer: {
          getProvider: () => ({ id: 'ollama', locality: 'local', generate: vi.fn() }),
          createProviderRequest: () => ({}),
          validateProviderResponse: () => ({ valid: true }),
        },
        clock: { nowMs: () => 1700000000000 },
        timer: { setTimeout: vi.fn(), clearTimeout: vi.fn() },
      })

      await expect(
        coordinator.executeWorkflow({
          templateId: 'financial-summary-explanation',
          insightBundle: sampleInsightBundle,
          recommendationBundle: sampleRecommendationBundle,
          financialSummary: sampleFinancialSummary,
          provider: { model: 'llama3.2' },
          memory: testMemoryDto,
        }),
      ).rejects.toThrow(/Unsupported memory alias/)
    })

    it('fails explicitly when invalid memoryState is provided', async () => {
      const coordinator = createServiceCoordinator({
        promptBuilder: { build: vi.fn() },
        providerLayer: {
          getProvider: () => ({ id: 'ollama', locality: 'local', generate: vi.fn() }),
          createProviderRequest: () => ({}),
          validateProviderResponse: () => ({ valid: true }),
        },
        clock: { nowMs: () => 1700000000000 },
        timer: { setTimeout: vi.fn(), clearTimeout: vi.fn() },
      })

      await expect(
        coordinator.executeWorkflow({
          templateId: 'financial-summary-explanation',
          insightBundle: sampleInsightBundle,
          recommendationBundle: sampleRecommendationBundle,
          financialSummary: sampleFinancialSummary,
          provider: { model: 'llama3.2' },
          memoryState: { version: '1.0.0', records: 'not-an-array' },
        }),
      ).rejects.toThrow(/Invalid memoryState/)
    })

    it('does not mutate memoryState or financial bundles during execution', async () => {
      const coordinator = createServiceCoordinator({
        promptBuilder: { build: vi.fn().mockReturnValue({ template: {} }) },
        providerLayer: {
          getProvider: () => ({ id: 'ollama', locality: 'local', generate: vi.fn().mockResolvedValue({ content: 'OK' }) }),
          createProviderRequest: () => ({}),
          validateProviderResponse: () => ({ valid: true }),
        },
        clock: { nowMs: () => 1700000000000 },
        timer: { setTimeout: vi.fn(), clearTimeout: vi.fn() },
      })

      const originalRecordsCount = testMemoryDto.records.length

      await coordinator.executeWorkflow({
        templateId: 'financial-summary-explanation',
        insightBundle: sampleInsightBundle,
        recommendationBundle: sampleRecommendationBundle,
        financialSummary: sampleFinancialSummary,
        memoryState: testMemoryDto,
        provider: { model: 'llama3.2' },
      })

      expect(testMemoryDto.records).toHaveLength(originalRecordsCount)
    })
  })
})
