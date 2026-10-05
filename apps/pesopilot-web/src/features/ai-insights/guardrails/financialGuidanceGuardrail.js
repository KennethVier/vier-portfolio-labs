import {
  GUARDRAIL_STAGES,
  GUARDRAIL_DECISIONS,
  createGuardrailDecision,
} from './guardrailDecision.js'
import { GUARDRAIL_ERROR_CODES } from './guardrailErrors.js'
import { scanForFinancialGuidanceViolations } from './threatPatterns.js'

export function validateFinancialGuidance(providerResponse) {
  if (!providerResponse || typeof providerResponse !== 'object') {
    return createGuardrailDecision({
      stage: GUARDRAIL_STAGES.FINANCIAL_GUIDANCE,
      decision: GUARDRAIL_DECISIONS.REJECT,
      primaryCode: GUARDRAIL_ERROR_CODES.INVALID_GUARDRAIL_INPUT,
      reasonCodes: ['INVALID_PROVIDER_RESPONSE'],
      reasons: ['ProviderResponse must be a valid non-null object.'],
    })
  }

  const content = typeof providerResponse.content === 'string' ? providerResponse.content : ''
  const scan = scanForFinancialGuidanceViolations(content)

  if (scan.detected) {
    return createGuardrailDecision({
      stage: GUARDRAIL_STAGES.FINANCIAL_GUIDANCE,
      decision: GUARDRAIL_DECISIONS.REJECT,
      primaryCode: GUARDRAIL_ERROR_CODES.FINANCIAL_GUIDANCE_REJECTED,
      reasonCodes: scan.reasonCodes,
      reasons: scan.reasons,
    })
  }

  return createGuardrailDecision({
    stage: GUARDRAIL_STAGES.FINANCIAL_GUIDANCE,
    decision: GUARDRAIL_DECISIONS.ALLOW,
  })
}
