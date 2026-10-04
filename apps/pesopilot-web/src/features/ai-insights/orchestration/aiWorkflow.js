import {
  WORKFLOW_ERROR_CODES,
  WorkflowError,
} from './workflowErrors.js'
import { validateWorkflowDiagnostics } from './workflowDiagnostics.js'

export const AI_WORKFLOW_VERSION = '1.0.0'

export const WORKFLOW_STATUSES = Object.freeze({
  PENDING: 'pending',
  RUNNING: 'running',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
  TIMED_OUT: 'timed_out',
})

const VALID_STATUSES = new Set(Object.values(WORKFLOW_STATUSES))

export function createWorkflow({
  workflowId,
  template,
  provider,
  startedAt = null,
} = {}) {
  if (typeof workflowId !== 'string' || !workflowId.trim()) {
    throw new WorkflowError({
      code: WORKFLOW_ERROR_CODES.INVALID_ORCHESTRATION_INPUT,
      message: 'Workflow workflowId must be a non-empty string.',
    })
  }

  if (
    !template ||
    typeof template !== 'object' ||
    typeof template.id !== 'string' ||
    !template.id.trim() ||
    typeof template.version !== 'string' ||
    !template.version.trim()
  ) {
    throw new WorkflowError({
      code: WORKFLOW_ERROR_CODES.INVALID_ORCHESTRATION_INPUT,
      message: 'Workflow template must be an object with valid id and version.',
    })
  }

  if (
    !provider ||
    typeof provider !== 'object' ||
    typeof provider.id !== 'string' ||
    !provider.id.trim() ||
    typeof provider.model !== 'string' ||
    !provider.model.trim()
  ) {
    throw new WorkflowError({
      code: WORKFLOW_ERROR_CODES.INVALID_ORCHESTRATION_INPUT,
      message: 'Workflow provider must be an object with valid id and model.',
    })
  }

  return Object.freeze({
    version: AI_WORKFLOW_VERSION,
    workflowId: workflowId.trim(),
    template: Object.freeze({
      id: template.id.trim(),
      version: template.version.trim(),
    }),
    task: typeof template.task === 'string' && template.task.trim()
      ? template.task.trim()
      : template.id.trim(),
    provider: Object.freeze({
      id: provider.id.trim(),
      model: provider.model.trim(),
    }),
    status: WORKFLOW_STATUSES.PENDING,
    attempt: 0,
    startedAt: typeof startedAt === 'string' && startedAt.trim() ? startedAt.trim() : null,
    completedAt: null,
    diagnostics: null,
  })
}

export function validateWorkflow(workflow) {
  const errors = []

  if (!workflow || typeof workflow !== 'object') {
    return {
      valid: false,
      errors: ['AIWorkflow must be a valid object.'],
    }
  }

  if (workflow.version !== AI_WORKFLOW_VERSION) {
    errors.push(`AIWorkflow version must be "${AI_WORKFLOW_VERSION}".`)
  }

  if (typeof workflow.workflowId !== 'string' || !workflow.workflowId.trim()) {
    errors.push('AIWorkflow workflowId must be a non-empty string.')
  }

  if (
    !workflow.template ||
    typeof workflow.template !== 'object' ||
    typeof workflow.template.id !== 'string' ||
    !workflow.template.id.trim() ||
    typeof workflow.template.version !== 'string' ||
    !workflow.template.version.trim()
  ) {
    errors.push('AIWorkflow template must have valid id and version.')
  }

  if (typeof workflow.task !== 'string' || !workflow.task.trim()) {
    errors.push('AIWorkflow task must be a non-empty string.')
  }

  if (
    !workflow.provider ||
    typeof workflow.provider !== 'object' ||
    typeof workflow.provider.id !== 'string' ||
    !workflow.provider.id.trim() ||
    typeof workflow.provider.model !== 'string' ||
    !workflow.provider.model.trim()
  ) {
    errors.push('AIWorkflow provider must have valid id and model.')
  }

  if (!VALID_STATUSES.has(workflow.status)) {
    errors.push(`AIWorkflow status must be one of: ${Array.from(VALID_STATUSES).join(', ')}.`)
  }

  if (
    typeof workflow.attempt !== 'number' ||
    !Number.isInteger(workflow.attempt) ||
    workflow.attempt < 0 ||
    workflow.attempt > 2
  ) {
    errors.push('AIWorkflow attempt must be an integer between 0 and 2.')
  }

  if (workflow.status === WORKFLOW_STATUSES.PENDING && workflow.attempt !== 0) {
    errors.push('AIWorkflow attempt must be 0 when status is pending.')
  }

  if (workflow.status !== WORKFLOW_STATUSES.PENDING && workflow.attempt === 0) {
    errors.push('AIWorkflow attempt must be greater than 0 when not pending.')
  }

  if (workflow.startedAt !== null && typeof workflow.startedAt !== 'string') {
    errors.push('AIWorkflow startedAt must be an ISO string or null.')
  }

  if (workflow.completedAt !== null && typeof workflow.completedAt !== 'string') {
    errors.push('AIWorkflow completedAt must be an ISO string or null.')
  }

  if (workflow.diagnostics !== null) {
    const diagValidation = validateWorkflowDiagnostics(workflow.diagnostics)
    if (!diagValidation.valid) {
      errors.push(...diagValidation.errors.map((e) => `Diagnostics error: ${e}`))
    }
  }

  const forbiddenKeys = [
    'promptPackage',
    'providerRequest',
    'providerResponse',
    'error',
    'insightBundle',
    'recommendationBundle',
    'financialSummary',
    'recentMessages',
    'messages',
  ]

  forbiddenKeys.forEach((key) => {
    if (key in workflow) {
      errors.push(`AIWorkflow must not contain "${key}".`)
    }
  })

  return {
    valid: errors.length === 0,
    errors,
  }
}
