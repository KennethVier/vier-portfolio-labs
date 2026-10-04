import {
  createMemoryDto,
  addMemoryRecord,
  MEMORY_DTO_VERSION,
} from './memoryDto.js'
import { createMemoryRecord } from './memoryRecord.js'
import {
  buildMemoryContext,
  MEMORY_CONTEXT_VERSION,
} from './memoryContext.js'
import { evaluateCandidate } from './memoryEvaluator.js'
import { retrieveMemories } from './memoryRetriever.js'
import { rankMemories } from './memoryRanker.js'
import {
  DEFAULT_MEMORY_POLICY,
  getDefaultPolicy,
  MEMORY_TYPES,
  MEMORY_IMPORTANCES,
  ALLOWED_WORKFLOW_TYPES,
} from './memoryPolicy.js'
import {
  validateMemoryDto,
  validateMemoryContext,
  validateMemoryRecord,
  validateMemoryCandidate,
} from './memoryValidator.js'

function retrieveContext({
  memoryDto,
  query,
  policy = DEFAULT_MEMORY_POLICY,
} = {}) {
  if (!memoryDto) {
    return null
  }
  const retrieved = retrieveMemories({ memoryDto, query, policy })
  if (retrieved.length === 0) {
    return null
  }
  const ranked = rankMemories(retrieved, { query })
  return buildMemoryContext({ records: ranked, policy })
}

export const memoryService = Object.freeze({
  name: 'memory-service',
  status: 'ready',

  addMemoryRecord,
  createMemoryDto,
  createMemoryRecord,
  evaluateCandidate,
  getPolicy: getDefaultPolicy,
  retrieveContext,
  validateMemoryContext,
  validateMemoryDto,
})

export {
  MEMORY_DTO_VERSION,
  MEMORY_CONTEXT_VERSION,
  MEMORY_TYPES,
  MEMORY_IMPORTANCES,
  ALLOWED_WORKFLOW_TYPES,
  DEFAULT_MEMORY_POLICY,
  createMemoryDto,
  createMemoryRecord,
  addMemoryRecord,
  evaluateCandidate,
  retrieveMemories,
  rankMemories,
  buildMemoryContext,
  retrieveContext,
  validateMemoryDto,
  validateMemoryContext,
  validateMemoryRecord,
  validateMemoryCandidate,
  getDefaultPolicy,
}
