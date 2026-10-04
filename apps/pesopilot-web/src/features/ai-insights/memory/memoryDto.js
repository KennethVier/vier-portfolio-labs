import { validateMemoryRecord } from './memoryValidator.js'

export const MEMORY_DTO_VERSION = '1.0.0'

export function createMemoryDto({
  records = [],
  version = MEMORY_DTO_VERSION,
} = {}) {
  if (version !== MEMORY_DTO_VERSION) {
    throw new Error(`MemoryDTO version must be "${MEMORY_DTO_VERSION}".`)
  }

  if (!Array.isArray(records)) {
    throw new Error('MemoryDTO records must be an array.')
  }

  const seenIds = new Set()
  const validatedRecords = records.map((record, idx) => {
    const recordValidation = validateMemoryRecord(record)
    if (!recordValidation.valid) {
      throw new Error(
        `Invalid record at index ${idx}: ${recordValidation.errors.join('; ')}`,
      )
    }

    if (seenIds.has(record.memoryId)) {
      throw new Error(
        `Duplicate memoryId "${record.memoryId}" is not allowed in MemoryDTO.`,
      )
    }
    seenIds.add(record.memoryId)

    return Object.freeze({
      memoryId: record.memoryId,
      type: record.type,
      content: record.content,
      topics: Object.freeze([...record.topics]),
      workflowTypes: Object.freeze([...record.workflowTypes]),
      importance: record.importance,
      source: Object.freeze({
        type: record.source.type,
        referenceId: record.source.referenceId ?? null,
      }),
      createdAt: record.createdAt,
    })
  })

  return Object.freeze({
    version: MEMORY_DTO_VERSION,
    records: Object.freeze(validatedRecords),
  })
}

export function addMemoryRecord(memoryDto, record) {
  if (!memoryDto || typeof memoryDto !== 'object' || !Array.isArray(memoryDto.records)) {
    throw new Error('addMemoryRecord requires a valid MemoryDTO.')
  }

  if (!record || typeof record !== 'object' || typeof record.memoryId !== 'string') {
    throw new Error('addMemoryRecord requires a valid MemoryRecord with a memoryId.')
  }

  const recordValidation = validateMemoryRecord(record)
  if (!recordValidation.valid) {
    throw new Error(
      `Cannot add invalid MemoryRecord: ${recordValidation.errors.join('; ')}`,
    )
  }

  if (memoryDto.records.some((r) => r.memoryId === record.memoryId)) {
    throw new Error(
      `MemoryRecord with memoryId "${record.memoryId}" already exists in MemoryDTO. Overwrite/merge rejected.`,
    )
  }

  return createMemoryDto({
    version: memoryDto.version ?? MEMORY_DTO_VERSION,
    records: [...memoryDto.records, record],
  })
}
