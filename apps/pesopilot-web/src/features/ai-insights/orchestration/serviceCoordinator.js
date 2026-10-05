import { promptBuilder as defaultPromptBuilder } from '../prompt/promptBuilder.js'
import { providerLayer as defaultProviderLayer } from '../providers/providerLayer.js'
import { memoryService as defaultMemoryService } from '../memory/memoryService.js'
import { guardrailEngine as defaultGuardrailEngine } from '../guardrails/guardrailEngine.js'
import { createAuditLogger as defaultCreateAuditLogger } from '../guardrails/auditLogger.js'
import { GuardrailError } from '../guardrails/guardrailErrors.js'
import { getWorkflowTemplate } from './workflowTemplates.js'
import { workflowManager } from './workflowManager.js'
import { createWorkflowDiagnostics } from './workflowDiagnostics.js'
import {
  createTimeoutManager,
  DEFAULT_WORKFLOW_TIMEOUT_MS,
} from './timeoutManager.js'
import {
  retryManager,
  MAX_WORKFLOW_ATTEMPTS,
  isRetryableProviderErrorCode,
} from './retryManager.js'
import {
  WORKFLOW_ERROR_CODES,
  WorkflowError,
} from './workflowErrors.js'
import { WORKFLOW_STATUSES } from './aiWorkflow.js'
import { createStreamSession, STREAM_LIFECYCLE_STATES } from '../streaming/streamManager.js'
import { StreamError, STREAM_ERROR_CODES } from '../streaming/streamErrors.js'
import { createProviderResponse } from '../providers/providerResponse.js'
import { createProviderDiagnostics } from '../providers/providerDiagnostics.js'

const DEFAULT_CLOCK = Object.freeze({
  nowMs: () => Date.now(),
  isoString: () => new Date().toISOString(),
})

const DEFAULT_TIMER = Object.freeze({
  setTimeout: (fn, ms) => globalThis.setTimeout(fn, ms),
  clearTimeout: (id) => globalThis.clearTimeout(id),
})

const DEFAULT_ID_GENERATOR = () => {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }
  return `wf-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function validateOrchestrationInput(input, memoryService = defaultMemoryService) {
  if (!input || typeof input !== 'object') {
    throw new WorkflowError({
      code: WORKFLOW_ERROR_CODES.INVALID_ORCHESTRATION_INPUT,
      message: 'Orchestration input must be a valid object.',
    })
  }

  if (typeof input.templateId !== 'string' || !input.templateId.trim()) {
    throw new WorkflowError({
      code: WORKFLOW_ERROR_CODES.INVALID_ORCHESTRATION_INPUT,
      message: 'Orchestration input requires a non-empty string templateId.',
    })
  }

  if (!input.insightBundle || typeof input.insightBundle !== 'object') {
    throw new WorkflowError({
      code: WORKFLOW_ERROR_CODES.INVALID_ORCHESTRATION_INPUT,
      message: 'Orchestration input requires a valid insightBundle object.',
    })
  }

  if (!input.recommendationBundle || typeof input.recommendationBundle !== 'object') {
    throw new WorkflowError({
      code: WORKFLOW_ERROR_CODES.INVALID_ORCHESTRATION_INPUT,
      message: 'Orchestration input requires a valid recommendationBundle object.',
    })
  }

  if (!input.financialSummary || typeof input.financialSummary !== 'object') {
    throw new WorkflowError({
      code: WORKFLOW_ERROR_CODES.INVALID_ORCHESTRATION_INPUT,
      message: 'Orchestration input requires a valid financialSummary object.',
    })
  }

  if (!input.provider || typeof input.provider !== 'object') {
    throw new WorkflowError({
      code: WORKFLOW_ERROR_CODES.INVALID_ORCHESTRATION_INPUT,
      message: 'Orchestration input requires a provider configuration object.',
    })
  }

  if (typeof input.provider.model !== 'string' || !input.provider.model.trim()) {
    throw new WorkflowError({
      code: WORKFLOW_ERROR_CODES.INVALID_ORCHESTRATION_INPUT,
      message: 'Orchestration input requires a non-empty provider.model string.',
    })
  }

  if (input.provider.id && input.provider.id !== 'ollama') {
    throw new WorkflowError({
      code: WORKFLOW_ERROR_CODES.INVALID_ORCHESTRATION_INPUT,
      message: `Unsupported provider "${input.provider.id}". Phase 11B.4 supports provider "ollama" only.`,
    })
  }

  if (
    input.memory !== undefined ||
    input.memoryDto !== undefined ||
    input.memories !== undefined
  ) {
    throw new WorkflowError({
      code: WORKFLOW_ERROR_CODES.INVALID_ORCHESTRATION_INPUT,
      message:
        'Unsupported memory alias. Orchestration input only accepts canonical "memoryState".',
    })
  }

  if (input.memoryState !== undefined && input.memoryState !== null) {
    const memValidation = memoryService.validateMemoryDto(input.memoryState)
    if (!memValidation.valid) {
      throw new WorkflowError({
        code: WORKFLOW_ERROR_CODES.INVALID_ORCHESTRATION_INPUT,
        message: `Invalid memoryState: ${memValidation.errors.join('; ')}`,
      })
    }
  }
}

const defaultAuditLogger = defaultCreateAuditLogger()

export function createServiceCoordinator({
  promptBuilder = defaultPromptBuilder,
  providerLayer = defaultProviderLayer,
  memoryService = defaultMemoryService,
  guardrailEngine = defaultGuardrailEngine,
  auditLogger = defaultAuditLogger,
  clock = DEFAULT_CLOCK,
  timer = DEFAULT_TIMER,
  idGenerator = DEFAULT_ID_GENERATOR,
  workflowTimeoutMs = DEFAULT_WORKFLOW_TIMEOUT_MS,
} = {}) {
  return Object.freeze({
    async executeWorkflow(input) {
      // 1. Validate Orchestration Input
      validateOrchestrationInput(input, memoryService)

      // 2. Guardrail Input Validation (before workflow creation)
      const inputDecision = guardrailEngine.validateInput(input)
      if (inputDecision.decision === 'reject') {
        const inputWorkflowId = typeof input?.workflowId === 'string' && input.workflowId.trim()
          ? input.workflowId.trim()
          : null
        const inputTemplateId = typeof input?.templateId === 'string' ? input.templateId : null
        const inputProviderId = input?.provider?.id || null

        auditLogger.logRejection({
          stage: 'input',
          code: inputDecision.primaryCode,
          reasonCodes: inputDecision.reasonCodes,
          workflowId: inputWorkflowId,
          templateId: inputTemplateId,
          providerId: inputProviderId,
        })

        throw new WorkflowError({
          code: WORKFLOW_ERROR_CODES.GUARDRAIL_REJECTED,
          message: `Workflow input rejected by guardrails: ${inputDecision.reasons.join('; ') || 'Input validation failed.'}`,
          workflowId: inputWorkflowId,
          templateId: inputTemplateId,
          providerId: inputProviderId,
        })
      }

      // 3. Resolve Workflow Template
      const template = getWorkflowTemplate(input.templateId)

      // 4. Resolve / Generate workflowId
      const workflowId = typeof input.workflowId === 'string' && input.workflowId.trim()
        ? input.workflowId.trim()
        : idGenerator()

      const providerId = input.provider.id || 'ollama'
      const providerModel = input.provider.model.trim()

      // 5. Create Pending Workflow
      const pendingWorkflow = workflowManager.createWorkflow({
        workflowId,
        template,
        provider: {
          id: providerId,
          model: providerModel,
        },
        startedAt: null,
      })

      // 6. Sample Started Time and Transition to Running (Attempt 1)
      const startedMs = clock.nowMs()
      const startedAt = new Date(startedMs).toISOString()
      let currentWorkflow = workflowManager.startWorkflow(pendingWorkflow, { startedAt })

      // 7. Start Timeout Manager with Master AbortController
      const timeoutManager = createTimeoutManager({
        timeoutMs: workflowTimeoutMs,
        startedMs,
        clock,
        timer,
      })

      let finalResponse = null
      let finalError = null

      try {
        // 8. Retrieve Memory Context if memoryState is supplied
        let memoryContext = null
        if (input.memoryState != null) {
          memoryContext = memoryService.retrieveContext({
            memoryDto: input.memoryState,
            query: {
              workflowType: template.id,
              topic: input.conversationContext?.topic?.current ?? 'general',
            },
          })
        }

        // 9. Guardrail Memory Validation (if memoryContext retrieved)
        if (memoryContext !== null) {
          const memDecision = guardrailEngine.validateMemory(memoryContext)
          if (memDecision.decision === 'reject') {
            throw new GuardrailError({
              stage: 'memory',
              code: memDecision.primaryCode,
              reasonCodes: memDecision.reasonCodes,
              message: memDecision.reasons.join('; ') || 'Memory rejected by guardrails.',
              workflowId,
              templateId: template.id,
              providerId,
              model: providerModel,
            })
          }
        }

        // 10. Build PromptPackage via Prompt Builder
        let promptPackage
        try {
          promptPackage = promptBuilder.build({
            insightBundle: input.insightBundle,
            recommendationBundle: input.recommendationBundle,
            financialSummary: input.financialSummary,
            conversationContext: input.conversationContext ?? null,
            memoryContext,
            templateId: template.promptTemplateId,
          })
        } catch (pbErr) {
          throw new WorkflowError({
            code: WORKFLOW_ERROR_CODES.INVALID_ORCHESTRATION_INPUT,
            message: `Prompt Builder failed: ${pbErr.message}`,
            workflowId,
            templateId: template.id,
            providerId,
            model: providerModel,
          })
        }

        // 11. Guardrail Prompt Validation
        const promptDecision = guardrailEngine.validatePrompt(promptPackage)
        if (promptDecision.decision === 'reject') {
          throw new GuardrailError({
            stage: 'prompt',
            code: promptDecision.primaryCode,
            reasonCodes: promptDecision.reasonCodes,
            message: promptDecision.reasons.join('; ') || 'Prompt rejected by guardrails.',
            workflowId,
            templateId: template.id,
            providerId,
            model: providerModel,
          })
        }

        // 12. Create ProviderRequest
        const providerRequest = typeof providerLayer.createProviderRequest === 'function'
          ? providerLayer.createProviderRequest({
              promptPackage,
              model: providerModel,
              providerId,
            })
          : {
              version: '1.0.0',
              providerId,
              model: providerModel,
              prompt: { system: promptPackage.systemPrompt, user: promptPackage.userPrompt },
            }

        // 13. Guardrail Provider Validation
        const providerDescriptor = typeof providerLayer.getProviderDescriptor === 'function'
          ? providerLayer.getProviderDescriptor(providerId)
          : { id: providerId, locality: 'local' }

        const providerDecision = guardrailEngine.validateProvider({
          providerRequest,
          providerDescriptor,
          model: providerModel,
        })
        if (providerDecision.decision === 'reject') {
          throw new GuardrailError({
            stage: 'provider',
            code: providerDecision.primaryCode,
            reasonCodes: providerDecision.reasonCodes,
            message: providerDecision.reasons.join('; ') || 'Provider rejected by guardrails.',
            workflowId,
            templateId: template.id,
            providerId,
            model: providerModel,
          })
        }

        // 14. Resolve Provider Adapter for Execution
        const adapter = providerLayer.getProvider(providerId)

        // 15. Execution Loop with Retry & Timeout Policy
        const configuredTransportTimeoutMs =
          typeof input.provider?.config?.transportTimeoutMs === 'number' &&
          input.provider.config.transportTimeoutMs > 0
            ? input.provider.config.transportTimeoutMs
            : 30000

        while (currentWorkflow.attempt <= MAX_WORKFLOW_ATTEMPTS) {
          const remainingMs = timeoutManager.getRemainingMs()
          if (remainingMs <= 0 || timeoutManager.signal.aborted) {
            finalError = {
              code: WORKFLOW_ERROR_CODES.WORKFLOW_TIMEOUT,
              message: `Workflow exceeded execution deadline of ${workflowTimeoutMs}ms.`,
            }
            break
          }

          const attemptTransportTimeoutMs = Math.min(
            configuredTransportTimeoutMs,
            remainingMs,
          )

          const providerConfig = {
            ...input.provider.config,
            transportTimeoutMs: attemptTransportTimeoutMs,
            signal: timeoutManager.signal,
          }

          try {
            const rawResponse = await adapter.generate(providerRequest, providerConfig)
            const validation = providerLayer.validateProviderResponse(rawResponse)
            if (!validation.valid) {
              finalError = {
                code: WORKFLOW_ERROR_CODES.PROVIDER_EXECUTION_FAILED,
                message: `Provider returned invalid response: ${validation.errors.join(' ')}`,
              }
              break
            }

            // 15. Guardrail Response Validation
            const responseDecision = guardrailEngine.validateResponse(rawResponse)
            if (responseDecision.decision === 'reject') {
              throw new GuardrailError({
                stage: 'response',
                code: responseDecision.primaryCode,
                reasonCodes: responseDecision.reasonCodes,
                message: responseDecision.reasons.join('; ') || 'Response rejected by guardrails.',
                workflowId,
                templateId: template.id,
                providerId,
                model: providerModel,
              })
            }

            // 16. Guardrail Financial Guidance Validation
            const financialGuidanceDecision = guardrailEngine.validateFinancialGuidance(rawResponse)
            if (financialGuidanceDecision.decision === 'reject') {
              throw new GuardrailError({
                stage: 'financial_guidance',
                code: financialGuidanceDecision.primaryCode,
                reasonCodes: financialGuidanceDecision.reasonCodes,
                message: financialGuidanceDecision.reasons.join('; ') || 'Financial guidance rejected by guardrails.',
                workflowId,
                templateId: template.id,
                providerId,
                model: providerModel,
              })
            }

            finalResponse = rawResponse
            break // Succeeded!
          } catch (err) {
            // GuardrailError is NEVER retryable!
            if (err instanceof GuardrailError) {
              auditLogger.logRejection({
                stage: err.stage,
                code: err.code,
                reasonCodes: err.reasonCodes,
                workflowId: err.workflowId,
                templateId: err.templateId,
                providerId: err.providerId,
                model: err.model,
              })
              finalError = {
                code: WORKFLOW_ERROR_CODES.GUARDRAIL_REJECTED,
                message: `Workflow ${err.stage} rejected by guardrails: ${err.message}`,
              }
              break
            }

            // A. Precedence: Check if master workflow signal was aborted
            if (timeoutManager.signal.aborted) {
              finalError = {
                code: WORKFLOW_ERROR_CODES.WORKFLOW_TIMEOUT,
                message: `Workflow exceeded execution deadline of ${workflowTimeoutMs}ms.`,
              }
              break
            }

            // B. Evaluate Retry Eligibility
            const canRetry = retryManager.shouldRetry({
              attempt: currentWorkflow.attempt,
              error: err,
              isWorkflowAborted: false,
              remainingMs: timeoutManager.getRemainingMs(),
            })

            if (canRetry) {
              currentWorkflow = workflowManager.incrementAttempt(currentWorkflow)
              continue
            }

            // C. Non-retryable or Retries Exhausted
            if (
              isRetryableProviderErrorCode(err?.code) &&
              currentWorkflow.attempt >= MAX_WORKFLOW_ATTEMPTS
            ) {
              finalError = {
                code: WORKFLOW_ERROR_CODES.RETRIES_EXHAUSTED,
                message: `Workflow retries exhausted after ${currentWorkflow.attempt} attempts: ${err.message}`,
              }
            } else {
              finalError = {
                code: WORKFLOW_ERROR_CODES.PROVIDER_EXECUTION_FAILED,
                message: err?.message || 'Provider execution failed.',
              }
            }
            break
          }
        }
      } catch (pipelineErr) {
        if (pipelineErr instanceof GuardrailError) {
          auditLogger.logRejection({
            stage: pipelineErr.stage,
            code: pipelineErr.code,
            reasonCodes: pipelineErr.reasonCodes,
            workflowId: pipelineErr.workflowId,
            templateId: pipelineErr.templateId,
            providerId: pipelineErr.providerId,
            model: pipelineErr.model,
          })
          finalError = {
            code: WORKFLOW_ERROR_CODES.GUARDRAIL_REJECTED,
            message: `Workflow ${pipelineErr.stage} rejected by guardrails: ${pipelineErr.message}`,
          }
        } else if (pipelineErr instanceof WorkflowError) {
          finalError = {
            code: pipelineErr.code,
            message: pipelineErr.message,
          }
        } else {
          finalError = {
            code: WORKFLOW_ERROR_CODES.PROVIDER_EXECUTION_FAILED,
            message: pipelineErr.message || 'Workflow pipeline execution failed.',
          }
        }
      } finally {
        timeoutManager.cancelTimer()
      }

      // 10. Sample Completed Time and Calculate Duration
      const completedMs = clock.nowMs()
      const completedAt = new Date(completedMs).toISOString()
      const durationMs = Math.max(0, completedMs - startedMs)

      // 11. Finalize Workflow State
      if (finalResponse) {
        const diagnostics = createWorkflowDiagnostics({
          workflowId,
          templateId: template.id,
          providerId,
          model: providerModel,
          status: WORKFLOW_STATUSES.SUCCEEDED,
          attempts: currentWorkflow.attempt,
          durationMs,
          finalErrorCode: null,
        })

        const completedWorkflow = workflowManager.completeWorkflow(currentWorkflow, {
          completedAt,
          diagnostics,
        })

        return Object.freeze({
          workflow: completedWorkflow,
          response: finalResponse,
        })
      }

      // 12. Failure / Timeout Terminal Finalization
      const finalStatus =
        finalError?.code === WORKFLOW_ERROR_CODES.WORKFLOW_TIMEOUT
          ? WORKFLOW_STATUSES.TIMED_OUT
          : WORKFLOW_STATUSES.FAILED

      const diagnostics = createWorkflowDiagnostics({
        workflowId,
        templateId: template.id,
        providerId,
        model: providerModel,
        status: finalStatus,
        attempts: currentWorkflow.attempt,
        durationMs,
        finalErrorCode: finalError?.code || WORKFLOW_ERROR_CODES.PROVIDER_EXECUTION_FAILED,
      })

      let terminalWorkflow
      if (finalStatus === WORKFLOW_STATUSES.TIMED_OUT) {
        terminalWorkflow = workflowManager.timeoutWorkflow(currentWorkflow, {
          completedAt,
          diagnostics,
        })
      } else {
        terminalWorkflow = workflowManager.failWorkflow(currentWorkflow, {
          completedAt,
          diagnostics,
        })
      }

      throw new WorkflowError({
        code: finalError?.code || WORKFLOW_ERROR_CODES.PROVIDER_EXECUTION_FAILED,
        message: finalError?.message || 'Workflow execution failed.',
        workflowId,
        templateId: template.id,
        providerId,
        model: providerModel,
        diagnostics,
        workflow: terminalWorkflow,
      })
    },

    async executeStreamingWorkflow(input, { onEvent = null, onChunk = null, streamId: explicitStreamId = null, session = null } = {}) {
      // 1. Validate Orchestration Input
      validateOrchestrationInput(input, memoryService)

      // 2. Guardrail Input Validation (before workflow creation)
      const inputDecision = guardrailEngine.validateInput(input)
      if (inputDecision.decision === 'reject') {
        const inputWorkflowId = typeof input?.workflowId === 'string' && input.workflowId.trim()
          ? input.workflowId.trim()
          : null
        const inputTemplateId = typeof input?.templateId === 'string' ? input.templateId : null
        const inputProviderId = input?.provider?.id || null

        auditLogger.logRejection({
          stage: 'input',
          code: inputDecision.primaryCode,
          reasonCodes: inputDecision.reasonCodes,
          workflowId: inputWorkflowId,
          templateId: inputTemplateId,
          providerId: inputProviderId,
        })

        throw new WorkflowError({
          code: WORKFLOW_ERROR_CODES.GUARDRAIL_REJECTED,
          message: `Workflow input rejected by guardrails: ${inputDecision.reasons.join('; ') || 'Input validation failed.'}`,
          workflowId: inputWorkflowId,
          templateId: inputTemplateId,
          providerId: inputProviderId,
        })
      }

      // 3. Resolve Workflow Template
      const template = getWorkflowTemplate(input.templateId)

      // 4. Resolve / Generate workflowId & streamId
      const workflowId = typeof input.workflowId === 'string' && input.workflowId.trim()
        ? input.workflowId.trim()
        : idGenerator()

      const streamId = typeof explicitStreamId === 'string' && explicitStreamId.trim()
        ? explicitStreamId.trim()
        : workflowId

      const providerId = input.provider.id || 'ollama'
      const providerModel = input.provider.model.trim()

      // 5. Create Pending Workflow
      const pendingWorkflow = workflowManager.createWorkflow({
        workflowId,
        template,
        provider: {
          id: providerId,
          model: providerModel,
        },
        startedAt: null,
      })

      // 6. Sample Started Time and Transition to Running (Attempt 1)
      const startedMs = clock.nowMs()
      const startedAt = new Date(startedMs).toISOString()
      let currentWorkflow = workflowManager.startWorkflow(pendingWorkflow, { startedAt })

      // 7. Start Timeout Manager with Master AbortController
      const timeoutManager = createTimeoutManager({
        timeoutMs: workflowTimeoutMs,
        startedMs,
        clock,
        timer,
      })

      // 8. Create or Adopt Isolated Stream Session Handle
      const streamSession = session || createStreamSession({
        streamId,
        clock,
        abortController: timeoutManager.controller,
        onEvent,
        onChunk,
        maxBufferLength: 5000,
      })

      if (session && session.abortController !== timeoutManager.controller) {
        session.abortController?.signal?.addEventListener('abort', () => {
          timeoutManager.controller.abort()
        })
      }

      let finalResponse = null
      let finalError = null

      try {
        // 9. Retrieve Memory Context if memoryState is supplied
        let memoryContext = null
        if (input.memoryState != null) {
          memoryContext = memoryService.retrieveContext({
            memoryDto: input.memoryState,
            query: {
              workflowType: template.id,
              topic: input.conversationContext?.topic?.current ?? 'general',
            },
          })
        }

        // 10. Guardrail Memory Validation (if memoryContext retrieved)
        if (memoryContext !== null) {
          const memDecision = guardrailEngine.validateMemory(memoryContext)
          if (memDecision.decision === 'reject') {
            throw new GuardrailError({
              stage: 'memory',
              code: memDecision.primaryCode,
              reasonCodes: memDecision.reasonCodes,
              message: memDecision.reasons.join('; ') || 'Memory rejected by guardrails.',
              workflowId,
              templateId: template.id,
              providerId,
              model: providerModel,
            })
          }
        }

        // 11. Build PromptPackage via Prompt Builder
        let promptPackage
        try {
          promptPackage = promptBuilder.build({
            insightBundle: input.insightBundle,
            recommendationBundle: input.recommendationBundle,
            financialSummary: input.financialSummary,
            conversationContext: input.conversationContext ?? null,
            memoryContext,
            templateId: template.promptTemplateId,
          })
        } catch (pbErr) {
          throw new WorkflowError({
            code: WORKFLOW_ERROR_CODES.INVALID_ORCHESTRATION_INPUT,
            message: `Prompt Builder failed: ${pbErr.message}`,
            workflowId,
            templateId: template.id,
            providerId,
            model: providerModel,
          })
        }

        // 12. Guardrail Prompt Validation
        const promptDecision = guardrailEngine.validatePrompt(promptPackage)
        if (promptDecision.decision === 'reject') {
          throw new GuardrailError({
            stage: 'prompt',
            code: promptDecision.primaryCode,
            reasonCodes: promptDecision.reasonCodes,
            message: promptDecision.reasons.join('; ') || 'Prompt rejected by guardrails.',
            workflowId,
            templateId: template.id,
            providerId,
            model: providerModel,
          })
        }

        // 13. Create ProviderStreamRequest
        const providerStreamRequest = typeof providerLayer.createProviderStreamRequest === 'function'
          ? providerLayer.createProviderStreamRequest({
              promptPackage,
              model: providerModel,
              providerId,
            })
          : {
              version: '1.0.0',
              providerId,
              model: providerModel,
              prompt: { system: promptPackage.systemPrompt, user: promptPackage.userPrompt },
            }

        // 14. Streaming Provider Guardrail Validation
        const providerDescriptor = typeof providerLayer.getProviderDescriptor === 'function'
          ? providerLayer.getProviderDescriptor(providerId)
          : { id: providerId, locality: 'local' }

        const providerDecision = guardrailEngine.validateStreamingProvider({
          providerStreamRequest,
          providerDescriptor,
          model: providerModel,
        })
        if (providerDecision.decision === 'reject') {
          throw new GuardrailError({
            stage: 'provider',
            code: providerDecision.primaryCode,
            reasonCodes: providerDecision.reasonCodes,
            message: providerDecision.reasons.join('; ') || 'Streaming provider rejected by guardrails.',
            workflowId,
            templateId: template.id,
            providerId,
            model: providerModel,
          })
        }

        // 15. Stream Capability Check
        if (typeof providerLayer.supportsStreaming === 'function' && !providerLayer.supportsStreaming(providerId)) {
          throw new WorkflowError({
            code: WORKFLOW_ERROR_CODES.PROVIDER_EXECUTION_FAILED,
            message: `Provider "${providerId}" does not support streaming execution.`,
            workflowId,
            templateId: template.id,
            providerId,
            model: providerModel,
          })
        }

        // 16. Resolve Provider Adapter for Streaming Execution
        const adapter = providerLayer.getProvider(providerId)
        if (!adapter || typeof adapter.stream !== 'function') {
          throw new WorkflowError({
            code: WORKFLOW_ERROR_CODES.PROVIDER_EXECUTION_FAILED,
            message: `Adapter for "${providerId}" does not implement a stream method.`,
            workflowId,
            templateId: template.id,
            providerId,
            model: providerModel,
          })
        }

        // 17. Execution Loop with Retry & Timeout Policy
        const configuredTransportTimeoutMs =
          typeof input.provider?.config?.transportTimeoutMs === 'number' &&
          input.provider.config.transportTimeoutMs > 0
            ? input.provider.config.transportTimeoutMs
            : 30000

        while (currentWorkflow.attempt <= MAX_WORKFLOW_ATTEMPTS) {
          const remainingMs = timeoutManager.getRemainingMs()
          if (remainingMs <= 0 || timeoutManager.signal.aborted) {
            streamSession.timeout()
            finalError = {
              code: WORKFLOW_ERROR_CODES.WORKFLOW_TIMEOUT,
              message: `Workflow exceeded execution deadline of ${workflowTimeoutMs}ms.`,
            }
            break
          }

          const attemptTransportTimeoutMs = Math.min(
            configuredTransportTimeoutMs,
            remainingMs,
          )

          const providerConfig = {
            ...input.provider.config,
            transportTimeoutMs: attemptTransportTimeoutMs,
            signal: timeoutManager.signal,
          }

          // Reset private buffer for fresh attempt
          streamSession.resetForRetry()
          let lastMetadata = null

          try {
            const fragmentStream = adapter.stream(providerStreamRequest, providerConfig)
            for await (const fragment of fragmentStream) {
              if (
                streamSession.getState() === STREAM_LIFECYCLE_STATES.CANCELLED ||
                streamSession.abortController?.signal?.aborted ||
                timeoutManager.signal.aborted
              ) {
                break
              }
              streamSession.onProviderFragment(fragment)
              if (fragment.done) {
                lastMetadata = fragment
                break
              }
            }

            if (
              streamSession.getState() === STREAM_LIFECYCLE_STATES.CANCELLED ||
              streamSession.abortController?.signal?.aborted
            ) {
              streamSession.cancel('Stream was cancelled.')
              finalError = {
                code: 'STREAM_CANCELLED',
                message: 'Stream execution was cancelled.',
              }
              break
            }

            const accumulatedContent = streamSession.onProviderComplete()

            const providerDiagnostics = createProviderDiagnostics({
              providerId,
              model: providerModel,
              totalDurationNs: lastMetadata?.totalDurationNs ?? null,
              loadDurationNs: lastMetadata?.loadDurationNs ?? null,
              promptEvalCount: lastMetadata?.promptEvalCount ?? null,
              evalCount: lastMetadata?.evalCount ?? null,
            })

            const rawResponse = createProviderResponse({
              providerId,
              model: providerModel,
              content: accumulatedContent,
              finishReason: lastMetadata?.rawDoneReason || 'stop',
              diagnostics: providerDiagnostics,
            })

            const validation = providerLayer.validateProviderResponse(rawResponse)
            const isResponseValid = validation.valid ?? validation.isValid
            if (!isResponseValid) {
              finalError = {
                code: WORKFLOW_ERROR_CODES.PROVIDER_EXECUTION_FAILED,
                message: `Provider returned invalid response: ${(validation.errors || []).join(' ')}`,
              }
              streamSession.fail(new Error(finalError.message))
              break
            }

            // 18. Response Guardrail Validation
            const responseDecision = guardrailEngine.validateResponse(rawResponse)
            if (responseDecision.decision === 'reject') {
              throw new GuardrailError({
                stage: 'response',
                code: responseDecision.primaryCode,
                reasonCodes: responseDecision.reasonCodes,
                message: responseDecision.reasons.join('; ') || 'Response rejected by guardrails.',
                workflowId,
                templateId: template.id,
                providerId,
                model: providerModel,
              })
            }

            // 19. Financial Guidance Guardrail Validation
            const financialGuidanceDecision = guardrailEngine.validateFinancialGuidance(rawResponse)
            if (financialGuidanceDecision.decision === 'reject') {
              throw new GuardrailError({
                stage: 'financial_guidance',
                code: financialGuidanceDecision.primaryCode,
                reasonCodes: financialGuidanceDecision.reasonCodes,
                message: financialGuidanceDecision.reasons.join('; ') || 'Financial guidance rejected by guardrails.',
                workflowId,
                templateId: template.id,
                providerId,
                model: providerModel,
              })
            }

            // 20. Safe Publication Gate — Publish chunks ONLY after guardrail approval
            streamSession.publishValidatedContent(accumulatedContent, { onChunk, onEvent })

            if (
              streamSession.getState() === STREAM_LIFECYCLE_STATES.CANCELLED ||
              streamSession.abortController?.signal?.aborted
            ) {
              finalError = {
                code: 'STREAM_CANCELLED',
                message: 'Stream publication was cancelled.',
              }
              break
            }

            finalResponse = rawResponse
            break
          } catch (err) {
            if (err instanceof GuardrailError) {
              streamSession.fail(err)
              auditLogger.logRejection({
                stage: err.stage,
                code: err.code,
                reasonCodes: err.reasonCodes,
                workflowId: err.workflowId,
                templateId: err.templateId,
                providerId: err.providerId,
                model: err.model,
              })
              finalError = {
                code: WORKFLOW_ERROR_CODES.GUARDRAIL_REJECTED,
                message: `Workflow ${err.stage} rejected by guardrails: ${err.message}`,
              }
              break
            }

            if (err instanceof StreamError && err.code === STREAM_ERROR_CODES.STREAM_BUFFER_LIMIT_EXCEEDED) {
              streamSession.fail(err)
              finalError = {
                code: WORKFLOW_ERROR_CODES.PROVIDER_EXECUTION_FAILED,
                message: err.message,
              }
              break
            }

            if (
              streamSession.getState() === STREAM_LIFECYCLE_STATES.CANCELLED ||
              (streamSession.abortController?.signal?.aborted && !timeoutManager.signal.aborted)
            ) {
              streamSession.cancel('Stream execution was cancelled.')
              finalError = {
                code: 'STREAM_CANCELLED',
                message: 'Stream execution was cancelled.',
              }
              break
            }

            if (timeoutManager.signal.aborted) {
              streamSession.timeout()
              finalError = {
                code: WORKFLOW_ERROR_CODES.WORKFLOW_TIMEOUT,
                message: `Workflow exceeded execution deadline of ${workflowTimeoutMs}ms.`,
              }
              break
            }

            const canRetry = retryManager.shouldRetry({
              attempt: currentWorkflow.attempt,
              error: err,
              isWorkflowAborted: false,
              remainingMs: timeoutManager.getRemainingMs(),
            })

            if (canRetry) {
              currentWorkflow = workflowManager.incrementAttempt(currentWorkflow)
              continue
            }

            streamSession.fail(err)
            if (
              isRetryableProviderErrorCode(err?.code) &&
              currentWorkflow.attempt >= MAX_WORKFLOW_ATTEMPTS
            ) {
              finalError = {
                code: WORKFLOW_ERROR_CODES.RETRIES_EXHAUSTED,
                message: `Workflow retries exhausted after ${currentWorkflow.attempt} attempts: ${err.message}`,
              }
            } else {
              finalError = {
                code: WORKFLOW_ERROR_CODES.PROVIDER_EXECUTION_FAILED,
                message: err?.message || 'Provider streaming execution failed.',
              }
            }
            break
          }
        }
      } catch (pipelineErr) {
        if (pipelineErr instanceof GuardrailError) {
          streamSession.fail(pipelineErr)
          auditLogger.logRejection({
            stage: pipelineErr.stage,
            code: pipelineErr.code,
            reasonCodes: pipelineErr.reasonCodes,
            workflowId: pipelineErr.workflowId,
            templateId: pipelineErr.templateId,
            providerId: pipelineErr.providerId,
            model: pipelineErr.model,
          })
          finalError = {
            code: WORKFLOW_ERROR_CODES.GUARDRAIL_REJECTED,
            message: `Workflow ${pipelineErr.stage} rejected by guardrails: ${pipelineErr.message}`,
          }
        } else if (pipelineErr instanceof WorkflowError) {
          streamSession.fail(pipelineErr)
          finalError = {
            code: pipelineErr.code,
            message: pipelineErr.message,
          }
        } else {
          streamSession.fail(pipelineErr)
          finalError = {
            code: WORKFLOW_ERROR_CODES.PROVIDER_EXECUTION_FAILED,
            message: pipelineErr.message || 'Workflow streaming pipeline execution failed.',
          }
        }
      } finally {
        timeoutManager.cancelTimer()
      }

      // 21. Sample Completed Time and Calculate Duration
      const completedMs = clock.nowMs()
      const completedAt = new Date(completedMs).toISOString()
      const durationMs = Math.max(0, completedMs - startedMs)

      // 22. Finalize Workflow State
      if (finalResponse) {
        const diagnostics = createWorkflowDiagnostics({
          workflowId,
          templateId: template.id,
          providerId,
          model: providerModel,
          status: WORKFLOW_STATUSES.SUCCEEDED,
          attempts: currentWorkflow.attempt,
          durationMs,
          finalErrorCode: null,
        })

        const completedWorkflow = workflowManager.completeWorkflow(currentWorkflow, {
          completedAt,
          diagnostics,
        })

        return Object.freeze({
          workflow: completedWorkflow,
          response: finalResponse,
          streamDiagnostics: streamSession.getDiagnostics(),
        })
      }

      // 23. Failure / Timeout Terminal Finalization
      const finalStatus =
        finalError?.code === WORKFLOW_ERROR_CODES.WORKFLOW_TIMEOUT
          ? WORKFLOW_STATUSES.TIMED_OUT
          : WORKFLOW_STATUSES.FAILED

      const diagnostics = createWorkflowDiagnostics({
        workflowId,
        templateId: template.id,
        providerId,
        model: providerModel,
        status: finalStatus,
        attempts: currentWorkflow.attempt,
        durationMs,
        finalErrorCode: finalError?.code || WORKFLOW_ERROR_CODES.PROVIDER_EXECUTION_FAILED,
      })

      let terminalWorkflow
      if (finalStatus === WORKFLOW_STATUSES.TIMED_OUT) {
        terminalWorkflow = workflowManager.timeoutWorkflow(currentWorkflow, {
          completedAt,
          diagnostics,
        })
      } else {
        terminalWorkflow = workflowManager.failWorkflow(currentWorkflow, {
          completedAt,
          diagnostics,
        })
      }

      throw new WorkflowError({
        code: finalError?.code || WORKFLOW_ERROR_CODES.PROVIDER_EXECUTION_FAILED,
        message: finalError?.message || 'Workflow streaming execution failed.',
        workflowId,
        templateId: template.id,
        providerId,
        model: providerModel,
        diagnostics,
        workflow: terminalWorkflow,
      })
    },
  })
}
