export const AUDIT_EVENT_VERSION = '1.0.0'

const DEFAULT_CLOCK = Object.freeze({
  nowMs: () => Date.now(),
})

const DEFAULT_ID_GENERATOR = () => {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }
  return `audit-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

const NOOP_SINK = () => {}

export function createAuditEvent({
  eventId,
  workflowId = null,
  stage,
  decision = 'reject',
  code,
  reasonCodes = [],
  metadata = {},
  createdAt,
} = {}) {
  if (typeof eventId !== 'string' || !eventId.trim()) {
    throw new Error('AuditEvent requires a non-empty eventId string.')
  }

  if (typeof stage !== 'string' || !stage.trim()) {
    throw new Error('AuditEvent requires a non-empty stage string.')
  }

  if (typeof code !== 'string' || !code.trim()) {
    throw new Error('AuditEvent requires a non-empty code string.')
  }

  if (typeof createdAt !== 'string' || !createdAt.trim()) {
    throw new Error('AuditEvent requires a valid createdAt ISO string.')
  }

  // Safe metadata projection only: templateId, providerId
  const safeMetadata = {}
  if (metadata && typeof metadata === 'object') {
    if (typeof metadata.templateId === 'string' && metadata.templateId.trim()) {
      safeMetadata.templateId = metadata.templateId.trim()
    }
    if (typeof metadata.providerId === 'string' && metadata.providerId.trim()) {
      safeMetadata.providerId = metadata.providerId.trim()
    }
  }

  return Object.freeze({
    version: AUDIT_EVENT_VERSION,
    eventId: eventId.trim(),
    workflowId: typeof workflowId === 'string' && workflowId.trim() ? workflowId.trim() : null,
    stage: stage.trim(),
    decision,
    code: code.trim(),
    reasonCodes: Object.freeze([...reasonCodes]),
    metadata: Object.freeze(safeMetadata),
    createdAt: createdAt.trim(),
  })
}

export function createInMemoryAuditSink({ maxEvents = 100 } = {}) {
  const events = []
  return Object.freeze({
    writeEvent(event) {
      if (events.length >= maxEvents) {
        events.shift()
      }
      events.push(event)
    },
    getEvents() {
      return Object.freeze([...events])
    },
    clear() {
      events.length = 0
    },
  })
}

export function createAuditLogger({
  writeEvent = NOOP_SINK,
  idGenerator = DEFAULT_ID_GENERATOR,
  clock = DEFAULT_CLOCK,
} = {}) {
  return Object.freeze({
    logRejection({
      stage,
      code,
      reasonCodes = [],
      workflowId = null,
      templateId = null,
      providerId = null,
    } = {}) {
      try {
        const eventId = idGenerator()
        const createdAt = new Date(clock.nowMs()).toISOString()
        const event = createAuditEvent({
          eventId,
          workflowId,
          stage,
          decision: 'reject',
          code,
          reasonCodes,
          metadata: { templateId, providerId },
          createdAt,
        })
        writeEvent(event)
        return event
      } catch {
        // Audit sink errors must never bypass the rejection or crash safety handling
        return null
      }
    },
  })
}
