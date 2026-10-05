import {
  GUARDRAIL_STAGES,
  GUARDRAIL_DECISIONS,
  createGuardrailDecision,
} from './guardrailDecision.js'
import { GUARDRAIL_ERROR_CODES } from './guardrailErrors.js'
import { DEFAULT_GUARDRAIL_POLICY } from './guardrailPolicy.js'
import {
  scanForPromptInjection,
  scanForSensitiveData,
} from './threatPatterns.js'

export function validateMemory(memoryContext, { policy = DEFAULT_GUARDRAIL_POLICY } = {}) {
  // If memory context is absent or empty, skip safely
  if (memoryContext === null || memoryContext === undefined) {
    return createGuardrailDecision({
      stage: GUARDRAIL_STAGES.MEMORY,
      decision: GUARDRAIL_DECISIONS.ALLOW,
    })
  }

  if (typeof memoryContext !== 'object') {
    return createGuardrailDecision({
      stage: GUARDRAIL_STAGES.MEMORY,
      decision: GUARDRAIL_DECISIONS.REJECT,
      primaryCode: GUARDRAIL_ERROR_CODES.INVALID_GUARDRAIL_INPUT,
      reasonCodes: ['INVALID_MEMORY_CONTEXT'],
      reasons: ['MemoryContext must be an object or null.'],
    })
  }

  const items = memoryContext.items
  if (!Array.isArray(items)) {
    return createGuardrailDecision({
      stage: GUARDRAIL_STAGES.MEMORY,
      decision: GUARDRAIL_DECISIONS.REJECT,
      primaryCode: GUARDRAIL_ERROR_CODES.INVALID_GUARDRAIL_INPUT,
      reasonCodes: ['INVALID_MEMORY_ITEMS'],
      reasons: ['MemoryContext items must be an array.'],
    })
  }

  const reasonCodes = []
  const reasons = []

  if (items.length > policy.maxMemoryItems) {
    reasonCodes.push('MEMORY_SIZE_EXCEEDED')
    reasons.push(`Memory items count (${items.length}) exceeds maximum limit of ${policy.maxMemoryItems}.`)
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (typeof item?.content === 'string') {
      if (item.content.length > policy.maxMemoryItemLength) {
        reasonCodes.push('MEMORY_SIZE_EXCEEDED')
        reasons.push(`Memory item at index ${i} exceeds maximum length of ${policy.maxMemoryItemLength} characters.`)
      }

      // Check prompt injection
      const injectionResult = scanForPromptInjection(item.content)
      if (injectionResult.detected) {
        reasonCodes.push(...injectionResult.reasonCodes)
        reasons.push(`Memory item at index ${i} contains prohibited instruction or injection patterns.`)
      }

      // Check sensitive data / secrets
      const sensitiveResult = scanForSensitiveData(item.content)
      if (sensitiveResult.detected) {
        reasonCodes.push(...sensitiveResult.reasonCodes)
        reasons.push(`Memory item at index ${i} contains prohibited sensitive data or credentials.`)
      }
    }
  }

  if (reasonCodes.length > 0) {
    return createGuardrailDecision({
      stage: GUARDRAIL_STAGES.MEMORY,
      decision: GUARDRAIL_DECISIONS.REJECT,
      primaryCode: GUARDRAIL_ERROR_CODES.MEMORY_REJECTED,
      reasonCodes,
      reasons,
    })
  }

  return createGuardrailDecision({
    stage: GUARDRAIL_STAGES.MEMORY,
    decision: GUARDRAIL_DECISIONS.ALLOW,
  })
}
