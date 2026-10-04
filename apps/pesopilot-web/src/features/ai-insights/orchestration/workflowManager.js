import {
  WORKFLOW_ERROR_CODES,
  WorkflowError,
} from './workflowErrors.js'
import {
  createWorkflow as createWorkflowDto,
  validateWorkflow as validateWorkflowDto,
  WORKFLOW_STATUSES,
} from './aiWorkflow.js'

export function createWorkflow(params) {
  return createWorkflowDto(params)
}

export function startWorkflow(workflow, { startedAt } = {}) {
  if (!workflow || typeof workflow !== 'object') {
    throw new WorkflowError({
      code: WORKFLOW_ERROR_CODES.INVALID_WORKFLOW_STATE,
      message: 'Workflow must be an object to start.',
    })
  }

  if (workflow.status !== WORKFLOW_STATUSES.PENDING) {
    throw new WorkflowError({
      code: WORKFLOW_ERROR_CODES.INVALID_WORKFLOW_STATE,
      message: `Cannot start workflow from status "${workflow.status}". Only "pending" workflows can start.`,
      workflowId: workflow.workflowId,
    })
  }

  if (typeof startedAt !== 'string' || !startedAt.trim()) {
    throw new WorkflowError({
      code: WORKFLOW_ERROR_CODES.INVALID_WORKFLOW_STATE,
      message: 'startWorkflow requires a valid ISO startedAt string.',
      workflowId: workflow.workflowId,
    })
  }

  return Object.freeze({
    ...workflow,
    status: WORKFLOW_STATUSES.RUNNING,
    attempt: 1,
    startedAt: startedAt.trim(),
  })
}

export function incrementAttempt(workflow) {
  if (!workflow || typeof workflow !== 'object') {
    throw new WorkflowError({
      code: WORKFLOW_ERROR_CODES.INVALID_WORKFLOW_STATE,
      message: 'Workflow must be an object to increment attempt.',
    })
  }

  if (workflow.status !== WORKFLOW_STATUSES.RUNNING) {
    throw new WorkflowError({
      code: WORKFLOW_ERROR_CODES.INVALID_WORKFLOW_STATE,
      message: `Cannot increment attempt on workflow with status "${workflow.status}". Workflow must be "running".`,
      workflowId: workflow.workflowId,
    })
  }

  if (workflow.attempt !== 1) {
    throw new WorkflowError({
      code: WORKFLOW_ERROR_CODES.INVALID_WORKFLOW_STATE,
      message: `Cannot increment attempt from ${workflow.attempt}. Maximum attempts is 2.`,
      workflowId: workflow.workflowId,
    })
  }

  return Object.freeze({
    ...workflow,
    attempt: 2,
  })
}

export function completeWorkflow(workflow, { completedAt, diagnostics } = {}) {
  if (!workflow || typeof workflow !== 'object') {
    throw new WorkflowError({
      code: WORKFLOW_ERROR_CODES.INVALID_WORKFLOW_STATE,
      message: 'Workflow must be an object to complete.',
    })
  }

  if (workflow.status !== WORKFLOW_STATUSES.RUNNING) {
    throw new WorkflowError({
      code: WORKFLOW_ERROR_CODES.INVALID_WORKFLOW_STATE,
      message: `Cannot complete workflow with status "${workflow.status}". Only "running" workflows can complete.`,
      workflowId: workflow.workflowId,
    })
  }

  if (typeof completedAt !== 'string' || !completedAt.trim()) {
    throw new WorkflowError({
      code: WORKFLOW_ERROR_CODES.INVALID_WORKFLOW_STATE,
      message: 'completeWorkflow requires a valid ISO completedAt string.',
      workflowId: workflow.workflowId,
    })
  }

  return Object.freeze({
    ...workflow,
    status: WORKFLOW_STATUSES.SUCCEEDED,
    completedAt: completedAt.trim(),
    diagnostics: diagnostics || null,
  })
}

export function failWorkflow(workflow, { completedAt, diagnostics } = {}) {
  if (!workflow || typeof workflow !== 'object') {
    throw new WorkflowError({
      code: WORKFLOW_ERROR_CODES.INVALID_WORKFLOW_STATE,
      message: 'Workflow must be an object to fail.',
    })
  }

  if (workflow.status !== WORKFLOW_STATUSES.RUNNING && workflow.status !== WORKFLOW_STATUSES.PENDING) {
    throw new WorkflowError({
      code: WORKFLOW_ERROR_CODES.INVALID_WORKFLOW_STATE,
      message: `Cannot fail workflow with terminal status "${workflow.status}".`,
      workflowId: workflow.workflowId,
    })
  }

  if (typeof completedAt !== 'string' || !completedAt.trim()) {
    throw new WorkflowError({
      code: WORKFLOW_ERROR_CODES.INVALID_WORKFLOW_STATE,
      message: 'failWorkflow requires a valid ISO completedAt string.',
      workflowId: workflow.workflowId,
    })
  }

  return Object.freeze({
    ...workflow,
    status: WORKFLOW_STATUSES.FAILED,
    completedAt: completedAt.trim(),
    diagnostics: diagnostics || null,
  })
}

export function timeoutWorkflow(workflow, { completedAt, diagnostics } = {}) {
  if (!workflow || typeof workflow !== 'object') {
    throw new WorkflowError({
      code: WORKFLOW_ERROR_CODES.INVALID_WORKFLOW_STATE,
      message: 'Workflow must be an object to timeout.',
    })
  }

  if (workflow.status !== WORKFLOW_STATUSES.RUNNING) {
    throw new WorkflowError({
      code: WORKFLOW_ERROR_CODES.INVALID_WORKFLOW_STATE,
      message: `Cannot timeout workflow with status "${workflow.status}". Only "running" workflows can timeout.`,
      workflowId: workflow.workflowId,
    })
  }

  if (typeof completedAt !== 'string' || !completedAt.trim()) {
    throw new WorkflowError({
      code: WORKFLOW_ERROR_CODES.INVALID_WORKFLOW_STATE,
      message: 'timeoutWorkflow requires a valid ISO completedAt string.',
      workflowId: workflow.workflowId,
    })
  }

  return Object.freeze({
    ...workflow,
    status: WORKFLOW_STATUSES.TIMED_OUT,
    completedAt: completedAt.trim(),
    diagnostics: diagnostics || null,
  })
}

export function validateWorkflow(workflow) {
  return validateWorkflowDto(workflow)
}

export const workflowManager = Object.freeze({
  createWorkflow,
  startWorkflow,
  incrementAttempt,
  completeWorkflow,
  failWorkflow,
  timeoutWorkflow,
  validateWorkflow,
})
