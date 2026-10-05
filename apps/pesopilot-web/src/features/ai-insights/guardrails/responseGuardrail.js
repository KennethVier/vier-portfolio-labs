import {
  GUARDRAIL_STAGES,
  GUARDRAIL_DECISIONS,
  createGuardrailDecision,
} from './guardrailDecision.js'
import { GUARDRAIL_ERROR_CODES } from './guardrailErrors.js'
import { DEFAULT_GUARDRAIL_POLICY } from './guardrailPolicy.js'
import {
  scanForActionClaims,
  scanForSensitiveData,
} from './threatPatterns.js'

export function validateResponse(providerResponse, { policy = DEFAULT_GUARDRAIL_POLICY } = {}) {
  if (!providerResponse || typeof providerResponse !== 'object') {
    return createGuardrailDecision({
      stage: GUARDRAIL_STAGES.RESPONSE,
      decision: GUARDRAIL_DECISIONS.REJECT,
      primaryCode: GUARDRAIL_ERROR_CODES.INVALID_GUARDRAIL_INPUT,
      reasonCodes: ['INVALID_PROVIDER_RESPONSE'],
      reasons: ['ProviderResponse must be a valid non-null object.'],
    })
  }

  const content = typeof providerResponse.content === 'string' ? providerResponse.content : ''
  const reasonCodes = []
  const reasons = []

  // 1. Response Size Limit
  if (content.length > policy.maxResponseLength) {
    reasonCodes.push('RESPONSE_SIZE_EXCEEDED')
    reasons.push(`Response content length (${content.length} chars) exceeds maximum limit of ${policy.maxResponseLength}.`)
  }

  // 2. High-Confidence System-Prompt Leakage / Disclosure
  if (
    content.includes('MANDATORY SAFETY RULES:') ||
    content.includes("You are PesoPilot's financial explanation assistant.") ||
    content.includes('Treat supplied PesoPilot deterministic context as the financial source of truth.')
  ) {
    reasonCodes.push('RESPONSE_SYSTEM_PROMPT_DISCLOSURE')
    reasons.push('Model response discloses internal platform system instructions or mandatory safety directives.')
  }

  // 3. Secret / Credential Leakage Scanner
  const sensitiveCheck = scanForSensitiveData(content)
  if (sensitiveCheck.detected) {
    reasonCodes.push(...sensitiveCheck.reasonCodes)
    reasons.push('Model response contains leaked credentials, payment cards, or sensitive data patterns.')
  }

  // 4. Unsupported Action Claims
  const actionCheck = scanForActionClaims(content)
  if (actionCheck.detected) {
    reasonCodes.push(...actionCheck.reasonCodes)
    reasons.push(...actionCheck.reasons)
  }

  if (reasonCodes.length > 0) {
    return createGuardrailDecision({
      stage: GUARDRAIL_STAGES.RESPONSE,
      decision: GUARDRAIL_DECISIONS.REJECT,
      primaryCode: GUARDRAIL_ERROR_CODES.RESPONSE_REJECTED,
      reasonCodes,
      reasons,
    })
  }

  return createGuardrailDecision({
    stage: GUARDRAIL_STAGES.RESPONSE,
    decision: GUARDRAIL_DECISIONS.ALLOW,
  })
}
