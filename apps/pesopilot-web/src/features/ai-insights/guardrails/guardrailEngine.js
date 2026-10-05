import { validateInput } from './inputGuardrail.js'
import { validateMemory } from './memoryGuardrail.js'
import { validatePrompt } from './promptGuardrail.js'
import { validateProvider } from './providerGuardrail.js'
import { validateResponse } from './responseGuardrail.js'
import { validateFinancialGuidance } from './financialGuidanceGuardrail.js'

export const guardrailEngine = Object.freeze({
  name: 'guardrail-engine',
  status: 'ready',

  validateInput,
  validateMemory,
  validatePrompt,
  validateProvider,
  validateResponse,
  validateFinancialGuidance,
})
