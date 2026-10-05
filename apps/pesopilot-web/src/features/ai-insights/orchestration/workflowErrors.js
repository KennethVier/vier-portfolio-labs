export const WORKFLOW_ERROR_CODES = Object.freeze({
  INVALID_ORCHESTRATION_INPUT: 'INVALID_ORCHESTRATION_INPUT',
  UNKNOWN_WORKFLOW_TEMPLATE: 'UNKNOWN_WORKFLOW_TEMPLATE',
  INVALID_WORKFLOW_STATE: 'INVALID_WORKFLOW_STATE',
  PROVIDER_EXECUTION_FAILED: 'PROVIDER_EXECUTION_FAILED',
  WORKFLOW_TIMEOUT: 'WORKFLOW_TIMEOUT',
  RETRIES_EXHAUSTED: 'RETRIES_EXHAUSTED',
  GUARDRAIL_REJECTED: 'GUARDRAIL_REJECTED',
})

export class WorkflowError extends Error {
  constructor({
    code,
    message,
    workflowId = null,
    templateId = null,
    providerId = null,
    model = null,
    diagnostics = null,
    workflow = null,
  }) {
    super(message)
    this.name = 'WorkflowError'
    this.code = code
    this.workflowId = workflowId
    this.templateId = templateId
    this.providerId = providerId
    this.model = model
    this.diagnostics = diagnostics
    this.workflow = workflow
  }
}
