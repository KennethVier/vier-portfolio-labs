import {
  GUARDRAIL_STAGES,
  GUARDRAIL_DECISIONS,
  createGuardrailDecision,
} from './guardrailDecision.js'
import { GUARDRAIL_ERROR_CODES } from './guardrailErrors.js'
import { DEFAULT_GUARDRAIL_POLICY } from './guardrailPolicy.js'
import { collectUntrustedStrings } from './untrustedTextExtractor.js'
import { scanForPromptInjection } from './threatPatterns.js'
import { getSafetyInstructions } from '../prompt/safetyInjector.js'

export function validatePrompt(promptPackage, { policy = DEFAULT_GUARDRAIL_POLICY } = {}) {
  if (!promptPackage || typeof promptPackage !== 'object') {
    return createGuardrailDecision({
      stage: GUARDRAIL_STAGES.PROMPT,
      decision: GUARDRAIL_DECISIONS.REJECT,
      primaryCode: GUARDRAIL_ERROR_CODES.INVALID_GUARDRAIL_INPUT,
      reasonCodes: ['INVALID_PROMPT_PACKAGE'],
      reasons: ['PromptPackage must be a valid non-null object.'],
    })
  }

  const reasonCodes = []
  const reasons = []

  // 1. Canonical Safety Block Integrity Verification
  const canonicalSafetyBlock = `MANDATORY SAFETY RULES:\n${getSafetyInstructions()}`
  const systemPrompt = typeof promptPackage.systemPrompt === 'string' ? promptPackage.systemPrompt : ''

  if (!systemPrompt.includes(canonicalSafetyBlock)) {
    reasonCodes.push('PROMPT_SYSTEM_INTEGRITY_VIOLATION')
    reasons.push('PromptPackage systemPrompt does not contain the complete canonical mandatory safety block.')
  }

  // 2. Prompt Size Ceilings
  const totalPromptLength = (systemPrompt.length) + (typeof promptPackage.userPrompt === 'string' ? promptPackage.userPrompt.length : 0)
  if (totalPromptLength > policy.maxPromptLength) {
    reasonCodes.push('PROMPT_SIZE_EXCEEDED')
    reasons.push(`Total prompt length (${totalPromptLength} chars) exceeds maximum limit of ${policy.maxPromptLength}.`)
  }

  // 3. Scan Untrusted Text Sources from Provenance Allowlist
  const untrustedStrings = collectUntrustedStrings(promptPackage)
  for (const item of untrustedStrings) {
    const scan = scanForPromptInjection(item.text)
    if (scan.detected) {
      reasonCodes.push(...scan.reasonCodes)
      reasons.push(`Prompt injection attempt detected in untrusted source "${item.path}".`)
    }
  }

  if (reasonCodes.length > 0) {
    return createGuardrailDecision({
      stage: GUARDRAIL_STAGES.PROMPT,
      decision: GUARDRAIL_DECISIONS.REJECT,
      primaryCode: GUARDRAIL_ERROR_CODES.PROMPT_REJECTED,
      reasonCodes,
      reasons,
    })
  }

  return createGuardrailDecision({
    stage: GUARDRAIL_STAGES.PROMPT,
    decision: GUARDRAIL_DECISIONS.ALLOW,
  })
}
