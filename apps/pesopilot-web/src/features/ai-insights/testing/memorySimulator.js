import {
  memoryService as defaultMemoryService,
  createMemoryRecord,
  addMemoryRecord,
  retrieveContext,
  evaluateCandidate,
  validateMemoryDto,
  DEFAULT_MEMORY_POLICY,
  MEMORY_TYPES,
  MEMORY_IMPORTANCES,
  ALLOWED_WORKFLOW_TYPES,
} from '../memory/memoryService.js'

export function createMemorySimulator({
  memoryService = defaultMemoryService,
  initialState = null,
  policy = DEFAULT_MEMORY_POLICY,
} = {}) {
  let memoryDto = initialState || memoryService.createMemoryDto({ records: [] })

  let memoryCounter = 0
  function nextMemoryId() {
    memoryCounter += 1
    return `mem-${String(memoryCounter).padStart(3, '0')}`
  }

  function addRecord(record) {
    memoryDto = (memoryService.addMemoryRecord || addMemoryRecord)(memoryDto, record)
    return memoryDto
  }

  function addCandidate({
    candidate,
    memoryId = null,
    createdAt = '2026-10-05T00:00:00.000Z',
  } = {}) {
    const id = memoryId || nextMemoryId()
    const record = (memoryService.createMemoryRecord || createMemoryRecord)({
      candidate,
      memoryId: id,
      createdAt,
    })
    return addRecord(record)
  }

  function addRecords(records) {
    if (!Array.isArray(records)) {
      throw new TypeError('addRecords requires an array of records.')
    }
    for (const record of records) {
      addRecord(record)
    }
    return memoryDto
  }

  function retrieve(query = {}) {
    return (memoryService.retrieveContext || retrieveContext)({
      memoryDto,
      query: {
        workflowType: query.workflowType || 'financial-summary-explanation',
        topic: query.topic || 'general',
        ...query,
      },
      policy,
    })
  }

  function getState() {
    return memoryDto
  }

  function validate() {
    return (memoryService.validateMemoryDto || validateMemoryDto)(memoryDto)
  }

  function evaluate(candidate) {
    return (memoryService.evaluateCandidate || evaluateCandidate)(candidate, policy)
  }

  return Object.freeze({
    addRecord,
    addCandidate,
    addRecords,
    retrieve,
    retrieveContext: retrieve,
    getState,
    getMemoryDto: getState,
    validate,
    evaluate,
    policy,
  })
}

export {
  DEFAULT_MEMORY_POLICY,
  MEMORY_TYPES,
  MEMORY_IMPORTANCES,
  ALLOWED_WORKFLOW_TYPES,
}
