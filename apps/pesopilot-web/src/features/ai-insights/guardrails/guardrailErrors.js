export const GUARDRAIL_ERROR_CODES = Object.freeze({
  INPUT_REJECTED: 'INPUT_REJECTED',
  MEMORY_REJECTED: 'MEMORY_REJECTED',
  PROMPT_REJECTED: 'PROMPT_REJECTED',
  PROVIDER_REJECTED: 'PROVIDER_REJECTED',
  RESPONSE_REJECTED: 'RESPONSE_REJECTED',
  FINANCIAL_GUIDANCE_REJECTED: 'FINANCIAL_GUIDANCE_REJECTED',
  INVALID_GUARDRAIL_INPUT: 'INVALID_GUARDRAIL_INPUT',
})

export class GuardrailError extends Error {
  constructor({
    stage,
    code,
    reasonCodes = [],
    message,
    workflowId = null,
    templateId = null,
    providerId = null,
    model = null,
  } = {}) {
    super(message)
    this.name = 'GuardrailError'
    this.stage = stage
    this.code = code
    this.reasonCodes = Object.freeze([...reasonCodes])
    this.workflowId = workflowId
    this.templateId = templateId
    this.providerId = providerId
    this.model = model

    Object.freeze(this)
  }
}
