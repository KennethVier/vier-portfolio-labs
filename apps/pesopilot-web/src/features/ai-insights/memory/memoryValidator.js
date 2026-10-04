import { DEFAULT_MEMORY_POLICY } from './memoryPolicy.js'

export function isValidTimestamp(value) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return false
  }
  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) {
    return false
  }
  return value.includes('T')
}

const PROHIBITED_RECORD_FIELDS = [
  'confidence',
  'status',
  'expiresAt',
  'updatedAt',
  'lastUsed',
  'usageFrequency',
  'collectionId',
  'knowledgeProfile',
  'embedding',
  'vector',
]

export function validateMemoryCandidate(candidate, policy = DEFAULT_MEMORY_POLICY) {
  const errors = []

  if (!candidate || typeof candidate !== 'object') {
    return {
      errors: ['Candidate must be a valid object.'],
      valid: false,
    }
  }

  if (candidate.explicitlyConfirmed !== true) {
    errors.push('Candidate explicitlyConfirmed must be strictly true.')
  }

  if (!candidate.type || typeof candidate.type !== 'string') {
    errors.push('Candidate requires a string type.')
  } else if (!policy.allowedMemoryTypes.includes(candidate.type)) {
    errors.push(
      `Unsupported memory type "${candidate.type}". Allowed: ${policy.allowedMemoryTypes.join(', ')}.`,
    )
  }

  if (
    !candidate.source ||
    typeof candidate.source !== 'object' ||
    candidate.source.type !== 'user'
  ) {
    errors.push('Candidate source must be an object with type "user".')
  }

  if (typeof candidate.content !== 'string') {
    errors.push('Candidate content must be a string.')
  } else {
    const trimmed = candidate.content.trim()
    if (trimmed.length === 0) {
      errors.push('Candidate content cannot be empty or whitespace-only.')
    } else if (trimmed.length > policy.maxContentLength) {
      errors.push(
        `Candidate content exceeds maximum length of ${policy.maxContentLength} characters.`,
      )
    }
  }

  const importance = candidate.importance ?? 'medium'
  if (!policy.allowedImportances.includes(importance)) {
    errors.push(
      `Invalid candidate importance "${importance}". Allowed: ${policy.allowedImportances.join(', ')}.`,
    )
  }

  if (!Array.isArray(candidate.topics) || candidate.topics.length === 0) {
    errors.push('Candidate topics must be a non-empty array.')
  } else {
    for (const topic of candidate.topics) {
      if (!policy.allowedTopics.includes(topic)) {
        errors.push(
          `Unsupported topic "${topic}". Allowed: ${policy.allowedTopics.join(', ')}.`,
        )
      }
    }
  }

  if (
    !Array.isArray(candidate.workflowTypes) ||
    candidate.workflowTypes.length === 0
  ) {
    errors.push('Candidate workflowTypes must be a non-empty array.')
  } else {
    for (const wf of candidate.workflowTypes) {
      if (!policy.allowedWorkflowTypes.includes(wf)) {
        errors.push(
          `Unsupported workflowType "${wf}". Allowed: ${policy.allowedWorkflowTypes.join(', ')}.`,
        )
      }
    }
  }

  return {
    errors,
    valid: errors.length === 0,
  }
}

export function validateMemoryRecord(record, policy = DEFAULT_MEMORY_POLICY) {
  const errors = []

  if (!record || typeof record !== 'object') {
    return {
      errors: ['MemoryRecord must be a valid object.'],
      valid: false,
    }
  }

  if (typeof record.memoryId !== 'string' || record.memoryId.trim().length === 0) {
    errors.push('MemoryRecord memoryId must be a non-empty string.')
  }

  if (!record.type || typeof record.type !== 'string') {
    errors.push('MemoryRecord requires a string type.')
  } else if (!policy.allowedMemoryTypes.includes(record.type)) {
    errors.push(
      `Unsupported memory type "${record.type}". Allowed: ${policy.allowedMemoryTypes.join(', ')}.`,
    )
  }

  if (typeof record.content !== 'string') {
    errors.push('MemoryRecord content must be a string.')
  } else {
    const trimmed = record.content.trim()
    if (trimmed.length === 0) {
      errors.push('MemoryRecord content cannot be empty or whitespace-only.')
    } else if (trimmed.length > policy.maxContentLength) {
      errors.push(
        `MemoryRecord content exceeds maximum length of ${policy.maxContentLength} characters.`,
      )
    }
  }

  if (!Array.isArray(record.topics) || record.topics.length === 0) {
    errors.push('MemoryRecord topics must be a non-empty array.')
  } else {
    for (const topic of record.topics) {
      if (!policy.allowedTopics.includes(topic)) {
        errors.push(
          `Unsupported topic "${topic}". Allowed: ${policy.allowedTopics.join(', ')}.`,
        )
      }
    }
  }

  if (!Array.isArray(record.workflowTypes) || record.workflowTypes.length === 0) {
    errors.push('MemoryRecord workflowTypes must be a non-empty array.')
  } else {
    for (const wf of record.workflowTypes) {
      if (!policy.allowedWorkflowTypes.includes(wf)) {
        errors.push(
          `Unsupported workflowType "${wf}". Allowed: ${policy.allowedWorkflowTypes.join(', ')}.`,
        )
      }
    }
  }

  if (!policy.allowedImportances.includes(record.importance)) {
    errors.push(
      `Invalid memory importance "${record.importance}". Allowed: ${policy.allowedImportances.join(', ')}.`,
    )
  }

  if (
    !record.source ||
    typeof record.source !== 'object' ||
    record.source.type !== 'user'
  ) {
    errors.push('MemoryRecord source must be an object with type "user".')
  }

  if (!isValidTimestamp(record.createdAt)) {
    errors.push('MemoryRecord createdAt must be a valid ISO-8601 timestamp string.')
  }

  for (const field of PROHIBITED_RECORD_FIELDS) {
    if (record[field] !== undefined) {
      errors.push(`Prohibited field "${field}" present in MemoryRecord for Phase 11B.5.`)
    }
  }

  return {
    errors,
    valid: errors.length === 0,
  }
}

export function validateMemoryDto(dto, policy = DEFAULT_MEMORY_POLICY) {
  const errors = []

  if (!dto || typeof dto !== 'object') {
    return {
      errors: ['MemoryDTO must be a valid object.'],
      valid: false,
    }
  }

  if (dto.version !== '1.0.0') {
    errors.push('MemoryDTO version must be "1.0.0".')
  }

  if (!Array.isArray(dto.records)) {
    errors.push('MemoryDTO records must be an array.')
    return {
      errors,
      valid: false,
    }
  }

  const seenIds = new Set()
  dto.records.forEach((record, idx) => {
    const recordValidation = validateMemoryRecord(record, policy)
    if (!recordValidation.valid) {
      errors.push(
        `Record at index ${idx} is invalid: ${recordValidation.errors.join('; ')}`,
      )
    }

    if (record && typeof record.memoryId === 'string' && record.memoryId.trim()) {
      if (seenIds.has(record.memoryId)) {
        errors.push(`Duplicate memoryId "${record.memoryId}" is not allowed in MemoryDTO.`)
      }
      seenIds.add(record.memoryId)
    }
  })

  return {
    errors,
    valid: errors.length === 0,
  }
}

export function validateMemoryContext(context, policy = DEFAULT_MEMORY_POLICY) {
  const errors = []

  if (!context || typeof context !== 'object') {
    return {
      errors: ['MemoryContext must be a valid object.'],
      valid: false,
    }
  }

  if (context.version !== '1.0.0') {
    errors.push('MemoryContext version must be "1.0.0".')
  }

  if (!Array.isArray(context.items)) {
    errors.push('MemoryContext items must be an array.')
    return {
      errors,
      valid: false,
    }
  }

  if (context.items.length > policy.maxRetrievedItems) {
    errors.push(
      `MemoryContext items count (${context.items.length}) exceeds maximum of ${policy.maxRetrievedItems}.`,
    )
  }

  let totalChars = 0
  const allowedKeys = new Set(['type', 'content'])

  context.items.forEach((item, idx) => {
    if (!item || typeof item !== 'object') {
      errors.push(`Item at index ${idx} must be an object.`)
      return
    }

    const itemKeys = Object.keys(item)
    for (const key of itemKeys) {
      if (!allowedKeys.has(key)) {
        errors.push(
          `Item at index ${idx} contains disallowed field "${key}". Only "type" and "content" are allowed in prompt-facing context.`,
        )
      }
    }

    if (!policy.allowedMemoryTypes.includes(item.type)) {
      errors.push(
        `Item at index ${idx} has unsupported memory type "${item.type}".`,
      )
    }

    if (typeof item.content !== 'string' || item.content.trim().length === 0) {
      errors.push(`Item at index ${idx} content must be a non-empty string.`)
    } else {
      if (item.content.length > policy.maxContentLength) {
        errors.push(
          `Item at index ${idx} content length (${item.content.length}) exceeds maximum of ${policy.maxContentLength}.`,
        )
      }
      totalChars += item.content.length
    }
  })

  if (totalChars > policy.maxTotalContextChars) {
    errors.push(
      `MemoryContext total content characters (${totalChars}) exceeds maximum of ${policy.maxTotalContextChars}.`,
    )
  }

  return {
    errors,
    valid: errors.length === 0,
  }
}
