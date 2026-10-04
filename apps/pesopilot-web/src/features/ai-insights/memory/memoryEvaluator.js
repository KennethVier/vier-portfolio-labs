import { DEFAULT_MEMORY_POLICY } from './memoryPolicy.js'
import { validateMemoryCandidate } from './memoryValidator.js'

export function evaluateCandidate(candidate, policy = DEFAULT_MEMORY_POLICY) {
  const validation = validateMemoryCandidate(candidate, policy)
  return {
    eligible: validation.valid,
    reasons: validation.errors,
  }
}
