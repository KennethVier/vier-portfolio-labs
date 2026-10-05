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

const DEFAULT_CLOCK = Object.freeze({
  nowMs: () => Date.now(),
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
  })
}
