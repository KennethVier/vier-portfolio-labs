import { DEFAULT_MEMORY_POLICY } from './memoryPolicy.js'

export function retrieveMemories({
  memoryDto,
  query,
  policy = DEFAULT_MEMORY_POLICY,
} = {}) {
  if (!memoryDto || !Array.isArray(memoryDto.records)) {
    return []
  }

  if (!query || typeof query !== 'object') {
    throw new Error('retrieveMemories requires a valid query object.')
  }

  if (typeof query.workflowType !== 'string' || query.workflowType.trim().length === 0) {
    throw new Error('retrieveMemories requires a non-empty string query.workflowType.')
  }

  const queryWorkflow = query.workflowType.trim()
  const rawTopic = typeof query.topic === 'string' ? query.topic.trim() : ''
  const queryTopic = rawTopic || 'general'

  return memoryDto.records.filter((record) => {
    // 1. Policy type check
    if (!policy.allowedMemoryTypes.includes(record.type)) {
      return false
    }

    // 2. Workflow match
    if (
      !Array.isArray(record.workflowTypes) ||
      !record.workflowTypes.includes(queryWorkflow)
    ) {
      return false
    }

    // 3. Topic match
    if (!Array.isArray(record.topics)) {
      return false
    }

    if (queryTopic === 'general') {
      return record.topics.includes('general')
    }

    return (
      record.topics.includes(queryTopic) || record.topics.includes('general')
    )
  })
}
