import {
  WORKFLOW_ERROR_CODES,
  WorkflowError,
} from './workflowErrors.js'

export const WORKFLOW_DIAGNOSTICS_VERSION = '1.0.0'

const ALLOWED_DIAGNOSTIC_STATUSES = new Set(['succeeded', 'failed', 'timed_out'])

export function createWorkflowDiagnostics({
  workflowId,
  templateId,
  providerId = 'ollama',
  model = '',
  status,
  attempts = 1,
  durationMs = 0,
  finalErrorCode = null,
} = {}) {
  if (typeof workflowId !== 'string' || !workflowId.trim()) {
    throw new WorkflowError({
      code: WORKFLOW_ERROR_CODES.INVALID_ORCHESTRATION_INPUT,
      message: 'WorkflowDiagnostics workflowId must be a non-empty string.',
    })
  }

  if (typeof templateId !== 'string' || !templateId.trim()) {
    throw new WorkflowError({
      code: WORKFLOW_ERROR_CODES.INVALID_ORCHESTRATION_INPUT,
      message: 'WorkflowDiagnostics templateId must be a non-empty string.',
    })
  }

  if (typeof providerId !== 'string' || !providerId.trim()) {
    throw new WorkflowError({
      code: WORKFLOW_ERROR_CODES.INVALID_ORCHESTRATION_INPUT,
      message: 'WorkflowDiagnostics providerId must be a non-empty string.',
    })
  }

  if (typeof model !== 'string' || !model.trim()) {
    throw new WorkflowError({
      code: WORKFLOW_ERROR_CODES.INVALID_ORCHESTRATION_INPUT,
      message: 'WorkflowDiagnostics model must be a non-empty string.',
    })
  }

  if (!ALLOWED_DIAGNOSTIC_STATUSES.has(status)) {
    throw new WorkflowError({
      code: WORKFLOW_ERROR_CODES.INVALID_ORCHESTRATION_INPUT,
      message: `WorkflowDiagnostics status must be one of: ${Array.from(ALLOWED_DIAGNOSTIC_STATUSES).join(', ')}.`,
    })
  }

  const safeAttempts = Number(attempts)
  if (!Number.isInteger(safeAttempts) || safeAttempts < 1 || safeAttempts > 2) {
    throw new WorkflowError({
      code: WORKFLOW_ERROR_CODES.INVALID_ORCHESTRATION_INPUT,
      message: 'WorkflowDiagnostics attempts must be 1 or 2.',
    })
  }

  const safeDurationMs = Number(durationMs)
  if (isNaN(safeDurationMs) || safeDurationMs < 0) {
    throw new WorkflowError({
      code: WORKFLOW_ERROR_CODES.INVALID_ORCHESTRATION_INPUT,
      message: 'WorkflowDiagnostics durationMs must be a non-negative number.',
    })
  }

  return Object.freeze({
    version: WORKFLOW_DIAGNOSTICS_VERSION,
    workflowId: workflowId.trim(),
    templateId: templateId.trim(),
    providerId: providerId.trim(),
    model: model.trim(),
    status,
    attempts: safeAttempts,
    durationMs: Math.round(safeDurationMs),
    finalErrorCode:
      typeof finalErrorCode === 'string' && finalErrorCode.trim()
        ? finalErrorCode.trim()
        : null,
  })
}

export function validateWorkflowDiagnostics(diagnostics) {
  const errors = []

  if (!diagnostics || typeof diagnostics !== 'object') {
    return {
      valid: false,
      errors: ['WorkflowDiagnostics must be a valid object.'],
    }
  }

  if (diagnostics.version !== WORKFLOW_DIAGNOSTICS_VERSION) {
    errors.push(`WorkflowDiagnostics version must be "${WORKFLOW_DIAGNOSTICS_VERSION}".`)
  }

  if (typeof diagnostics.workflowId !== 'string' || !diagnostics.workflowId.trim()) {
    errors.push('WorkflowDiagnostics workflowId must be a non-empty string.')
  }

  if (typeof diagnostics.templateId !== 'string' || !diagnostics.templateId.trim()) {
    errors.push('WorkflowDiagnostics templateId must be a non-empty string.')
  }

  if (typeof diagnostics.providerId !== 'string' || !diagnostics.providerId.trim()) {
    errors.push('WorkflowDiagnostics providerId must be a non-empty string.')
  }

  if (typeof diagnostics.model !== 'string' || !diagnostics.model.trim()) {
    errors.push('WorkflowDiagnostics model must be a non-empty string.')
  }

  if (!ALLOWED_DIAGNOSTIC_STATUSES.has(diagnostics.status)) {
    errors.push(`WorkflowDiagnostics status must be one of: ${Array.from(ALLOWED_DIAGNOSTIC_STATUSES).join(', ')}.`)
  }

  if (
    typeof diagnostics.attempts !== 'number' ||
    !Number.isInteger(diagnostics.attempts) ||
    diagnostics.attempts < 1 ||
    diagnostics.attempts > 2
  ) {
    errors.push('WorkflowDiagnostics attempts must be 1 or 2.')
  }

  if (
    typeof diagnostics.durationMs !== 'number' ||
    isNaN(diagnostics.durationMs) ||
    diagnostics.durationMs < 0
  ) {
    errors.push('WorkflowDiagnostics durationMs must be a non-negative number.')
  }

  if (
    diagnostics.finalErrorCode !== null &&
    (typeof diagnostics.finalErrorCode !== 'string' || !diagnostics.finalErrorCode.trim())
  ) {
    errors.push('WorkflowDiagnostics finalErrorCode must be a non-empty string or null.')
  }

  const forbiddenKeys = [
    'prompt',
    'systemPrompt',
    'userPrompt',
    'promptPackage',
    'providerRequest',
    'providerResponse',
    'content',
    'response',
    'error',
    'cause',
    'stack',
    'rawText',
  ]

  forbiddenKeys.forEach((key) => {
    if (key in diagnostics) {
      errors.push(`WorkflowDiagnostics must not contain "${key}".`)
    }
  })

  return {
    valid: errors.length === 0,
    errors,
  }
}
