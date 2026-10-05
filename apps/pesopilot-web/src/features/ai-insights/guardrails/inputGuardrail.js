import {
  GUARDRAIL_STAGES,
  GUARDRAIL_DECISIONS,
  createGuardrailDecision,
} from './guardrailDecision.js'
import { GUARDRAIL_ERROR_CODES } from './guardrailErrors.js'
import {
  DEFAULT_GUARDRAIL_POLICY,
  ALLOWED_ORCHESTRATION_INPUT_FIELDS,
  ALLOWED_PROVIDER_FIELDS,
  ALLOWED_PROVIDER_CONFIG_FIELDS,
} from './guardrailPolicy.js'

export function validateInput(input, { policy = DEFAULT_GUARDRAIL_POLICY } = {}) {
  const reasonCodes = []
  const reasons = []

  if (!input || typeof input !== 'object') {
    return createGuardrailDecision({
      stage: GUARDRAIL_STAGES.INPUT,
      decision: GUARDRAIL_DECISIONS.REJECT,
      primaryCode: GUARDRAIL_ERROR_CODES.INVALID_GUARDRAIL_INPUT,
      reasonCodes: ['INVALID_INPUT_OBJECT'],
      reasons: ['Orchestration input must be a valid non-null object.'],
    })
  }

  // 1. Strict Allowlist on Top-Level Input Fields
  const inputKeys = Object.keys(input)
  for (const key of inputKeys) {
    if (!ALLOWED_ORCHESTRATION_INPUT_FIELDS.has(key)) {
      reasonCodes.push('UNRECOGNIZED_CONTROL_FIELDS')
      reasons.push(`Unknown or prohibited public control field "${key}" detected in orchestration input.`)
      break
    }
  }

  // 2. Strict Allowlist on Provider Fields
  if (input.provider && typeof input.provider === 'object') {
    for (const key of Object.keys(input.provider)) {
      if (!ALLOWED_PROVIDER_FIELDS.has(key)) {
        reasonCodes.push('UNRECOGNIZED_CONTROL_FIELDS')
        reasons.push(`Unknown or prohibited provider control field "${key}" detected.`)
        break
      }
    }

    if (input.provider.config && typeof input.provider.config === 'object') {
      for (const key of Object.keys(input.provider.config)) {
        if (!ALLOWED_PROVIDER_CONFIG_FIELDS.has(key)) {
          reasonCodes.push('UNRECOGNIZED_CONTROL_FIELDS')
          reasons.push(`Unknown or prohibited provider.config field "${key}" detected.`)
          break
        }
      }
    }
  }

  // 3. Supported Workflow Policy
  if (typeof input.templateId !== 'string' || !policy.supportedWorkflows.includes(input.templateId)) {
    reasonCodes.push('INPUT_UNSUPPORTED_WORKFLOW')
    reasons.push(`Workflow templateId "${input.templateId}" is not permitted under active guardrail policy.`)
  }

  // 4. Allowed Provider Policy
  const providerId = input.provider?.id || 'ollama'
  if (!policy.supportedProviders.includes(providerId)) {
    reasonCodes.push('INPUT_UNSUPPORTED_PROVIDER')
    reasons.push(`Provider "${providerId}" is not permitted under active guardrail policy.`)
  }

  // 5. Conversation Context Ceilings
  if (input.conversationContext && Array.isArray(input.conversationContext.recentMessages)) {
    if (input.conversationContext.recentMessages.length > policy.maxConversationMessages) {
      reasonCodes.push('INPUT_SIZE_EXCEEDED')
      reasons.push(`Conversation messages count exceeds limit of ${policy.maxConversationMessages}.`)
    }

    for (const msg of input.conversationContext.recentMessages) {
      if (typeof msg?.content === 'string' && msg.content.length > policy.maxConversationMessageLength) {
        reasonCodes.push('INPUT_SIZE_EXCEEDED')
        reasons.push(`Conversation message length exceeds limit of ${policy.maxConversationMessageLength} characters.`)
        break
      }
    }
  }

  if (reasonCodes.length > 0) {
    return createGuardrailDecision({
      stage: GUARDRAIL_STAGES.INPUT,
      decision: GUARDRAIL_DECISIONS.REJECT,
      primaryCode: GUARDRAIL_ERROR_CODES.INPUT_REJECTED,
      reasonCodes,
      reasons,
    })
  }

  return createGuardrailDecision({
    stage: GUARDRAIL_STAGES.INPUT,
    decision: GUARDRAIL_DECISIONS.ALLOW,
  })
}
