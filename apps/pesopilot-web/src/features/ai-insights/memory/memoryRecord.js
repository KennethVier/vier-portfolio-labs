import { evaluateCandidate } from './memoryEvaluator.js'
import { isValidTimestamp } from './memoryValidator.js'

export function createMemoryRecord({
  candidate,
  memoryId,
  createdAt,
} = {}) {
  if (typeof memoryId !== 'string' || memoryId.trim().length === 0) {
    throw new Error('createMemoryRecord requires a caller-supplied non-empty string memoryId.')
  }

  if (typeof createdAt !== 'string' || !isValidTimestamp(createdAt)) {
    throw new Error('createMemoryRecord requires a valid ISO-8601 createdAt timestamp string.')
  }

  const evaluation = evaluateCandidate(candidate)
  if (!evaluation.eligible) {
    throw new Error(
      `Candidate is not eligible for MemoryRecord: ${evaluation.reasons.join('; ')}`,
    )
  }

  return Object.freeze({
    memoryId: memoryId.trim(),
    type: candidate.type,
    content: candidate.content.trim(),
    topics: Object.freeze([...candidate.topics]),
    workflowTypes: Object.freeze([...candidate.workflowTypes]),
    importance: candidate.importance ?? 'medium',
    source: Object.freeze({
      type: 'user',
      referenceId: candidate.source?.referenceId ?? null,
    }),
    createdAt,
  })
}
