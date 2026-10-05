import {
  GUARDRAIL_STAGES,
  GUARDRAIL_DECISIONS,
  createGuardrailDecision,
} from './guardrailDecision.js'
import { GUARDRAIL_ERROR_CODES } from './guardrailErrors.js'
import { DEFAULT_GUARDRAIL_POLICY } from './guardrailPolicy.js'

export function validateProvider({
  providerRequest,
  providerDescriptor,
  model,
} = {}, { policy = DEFAULT_GUARDRAIL_POLICY } = {}) {
  const reasonCodes = []
  const reasons = []

  if (!providerRequest || typeof providerRequest !== 'object') {
    return createGuardrailDecision({
      stage: GUARDRAIL_STAGES.PROVIDER,
      decision: GUARDRAIL_DECISIONS.REJECT,
      primaryCode: GUARDRAIL_ERROR_CODES.INVALID_GUARDRAIL_INPUT,
      reasonCodes: ['INVALID_PROVIDER_REQUEST'],
      reasons: ['ProviderRequest must be a valid non-null object.'],
    })
  }

  // 1. Registered Provider & Descriptor Check
  if (!providerDescriptor || typeof providerDescriptor !== 'object') {
    reasonCodes.push('PROVIDER_UNREGISTERED')
    reasons.push('Provider descriptor is missing or unregistered in provider registry.')
  }

  // 2. Provider ID Whitelist
  const providerId = providerRequest.providerId
  if (!policy.supportedProviders.includes(providerId)) {
    reasonCodes.push('PROVIDER_UNSUPPORTED')
    reasons.push(`Provider "${providerId}" is not permitted under active guardrail policy.`)
  }

  // 3. Locality Policy (Browser phase requires local; cloud is rejected)
  const locality = providerDescriptor?.locality
  if (!policy.allowedLocalities.includes(locality)) {
    reasonCodes.push('PROVIDER_LOCALITY_VIOLATION')
    reasons.push(`Provider locality "${locality}" is not permitted in browser phase. Only local providers are allowed.`)
  }

  // 4. Streaming Policy (Phase 11B.6 requires stream: false)
  if (providerRequest.generation?.stream !== false) {
    reasonCodes.push('PROVIDER_STREAM_NOT_ALLOWED')
    reasons.push('Streaming generation is not permitted in Phase 11B.6. Request generation.stream must be false.')
  }

  // 5. Model Matching Policy
  if (model && typeof model === 'string' && providerRequest.model !== model.trim()) {
    reasonCodes.push('PROVIDER_MODEL_MISMATCH')
    reasons.push(`ProviderRequest model "${providerRequest.model}" does not match configured workflow model "${model.trim()}".`)
  }

  if (reasonCodes.length > 0) {
    return createGuardrailDecision({
      stage: GUARDRAIL_STAGES.PROVIDER,
      decision: GUARDRAIL_DECISIONS.REJECT,
      primaryCode: GUARDRAIL_ERROR_CODES.PROVIDER_REJECTED,
      reasonCodes,
      reasons,
    })
  }

  return createGuardrailDecision({
    stage: GUARDRAIL_STAGES.PROVIDER,
    decision: GUARDRAIL_DECISIONS.ALLOW,
  })
}
