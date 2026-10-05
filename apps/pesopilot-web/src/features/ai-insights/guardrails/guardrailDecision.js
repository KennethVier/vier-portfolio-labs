export const GUARDRAIL_DECISION_VERSION = '1.0.0'

export const GUARDRAIL_STAGES = Object.freeze({
  INPUT: 'input',
  MEMORY: 'memory',
  PROMPT: 'prompt',
  PROVIDER: 'provider',
  RESPONSE: 'response',
  FINANCIAL_GUIDANCE: 'financial_guidance',
})

export const GUARDRAIL_DECISIONS = Object.freeze({
  ALLOW: 'allow',
  REJECT: 'reject',
})

const VALID_STAGES = new Set(Object.values(GUARDRAIL_STAGES))
const VALID_DECISIONS = new Set(Object.values(GUARDRAIL_DECISIONS))

export function createGuardrailDecision({
  stage,
  decision,
  primaryCode = null,
  reasonCodes = [],
  reasons = [],
} = {}) {
  if (!stage || !VALID_STAGES.has(stage)) {
    throw new Error(`Invalid guardrail stage: "${stage}". Allowed: ${[...VALID_STAGES].join(', ')}.`)
  }

  if (!decision || !VALID_DECISIONS.has(decision)) {
    throw new Error(`Invalid guardrail decision: "${decision}". Allowed: ${[...VALID_DECISIONS].join(', ')}.`)
  }

  if (decision === GUARDRAIL_DECISIONS.ALLOW && primaryCode !== null) {
    throw new Error('GuardrailDecision with decision "allow" must have primaryCode set to null.')
  }

  if (decision === GUARDRAIL_DECISIONS.REJECT) {
    if (typeof primaryCode !== 'string' || !primaryCode.trim()) {
      throw new Error('GuardrailDecision with decision "reject" requires a non-empty primaryCode string.')
    }
  }

  if (!Array.isArray(reasonCodes)) {
    throw new Error('GuardrailDecision reasonCodes must be an array of strings.')
  }

  if (!Array.isArray(reasons)) {
    throw new Error('GuardrailDecision reasons must be an array of strings.')
  }

  return Object.freeze({
    version: GUARDRAIL_DECISION_VERSION,
    stage,
    decision,
    primaryCode: decision === GUARDRAIL_DECISIONS.ALLOW ? null : primaryCode.trim(),
    reasonCodes: Object.freeze([...reasonCodes]),
    reasons: Object.freeze([...reasons]),
  })
}

export function validateGuardrailDecision(decision) {
  const errors = []

  if (!decision || typeof decision !== 'object') {
    return {
      valid: false,
      errors: ['GuardrailDecision must be a valid object.'],
    }
  }

  if (decision.version !== GUARDRAIL_DECISION_VERSION) {
    errors.push(`GuardrailDecision version must be "${GUARDRAIL_DECISION_VERSION}".`)
  }

  if (!VALID_STAGES.has(decision.stage)) {
    errors.push(`GuardrailDecision stage "${decision.stage}" is invalid.`)
  }

  if (!VALID_DECISIONS.has(decision.decision)) {
    errors.push(`GuardrailDecision decision "${decision.decision}" is invalid.`)
  }

  if (decision.decision === GUARDRAIL_DECISIONS.ALLOW && decision.primaryCode !== null) {
    errors.push('GuardrailDecision with decision "allow" must have null primaryCode.')
  }

  if (decision.decision === GUARDRAIL_DECISIONS.REJECT) {
    if (typeof decision.primaryCode !== 'string' || !decision.primaryCode.trim()) {
      errors.push('GuardrailDecision with decision "reject" must have a non-empty primaryCode string.')
    }
  }

  if (!Array.isArray(decision.reasonCodes)) {
    errors.push('GuardrailDecision reasonCodes must be an array.')
  }

  if (!Array.isArray(decision.reasons)) {
    errors.push('GuardrailDecision reasons must be an array.')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
