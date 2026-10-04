export const SESSION_STATUSES = Object.freeze({
  active: 'active',
  closed: 'closed',
})

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

export function createSession({
  endedAt = null,
  startedAt,
  status = SESSION_STATUSES.active,
} = {}) {
  if (!startedAt || typeof startedAt !== 'string') {
    throw new Error('createSession requires a caller-supplied startedAt timestamp.')
  }
  if (!isValidTimestamp(startedAt)) {
    throw new Error('createSession requires a valid ISO-8601 startedAt timestamp.')
  }
  if (!Object.values(SESSION_STATUSES).includes(status)) {
    throw new Error(
      `Invalid session status "${status}". Allowed: ${Object.values(SESSION_STATUSES).join(', ')}.`,
    )
  }

  if (status === SESSION_STATUSES.active && endedAt !== null) {
    throw new Error('Active session cannot have endedAt set.')
  }

  if (status === SESSION_STATUSES.closed) {
    if (!endedAt || typeof endedAt !== 'string') {
      throw new Error('Closed session requires a caller-supplied endedAt timestamp.')
    }
    if (!isValidTimestamp(endedAt)) {
      throw new Error('Closed session requires a valid ISO-8601 endedAt timestamp.')
    }
  }

  return Object.freeze({
    status,
    startedAt,
    endedAt,
  })
}

export function closeSession(session, { endedAt } = {}) {
  if (!session || typeof session !== 'object') {
    throw new Error('closeSession requires a valid session object.')
  }
  if (session.status === SESSION_STATUSES.closed) {
    throw new Error('Session is already closed.')
  }
  if (!endedAt || typeof endedAt !== 'string') {
    throw new Error('closeSession requires a caller-supplied endedAt timestamp.')
  }
  if (!isValidTimestamp(endedAt)) {
    throw new Error('closeSession requires a valid ISO-8601 endedAt timestamp.')
  }

  return createSession({
    status: SESSION_STATUSES.closed,
    startedAt: session.startedAt,
    endedAt,
  })
}
