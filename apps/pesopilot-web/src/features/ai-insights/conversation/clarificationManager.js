export const CLARIFICATION_REASONS = Object.freeze({
  ambiguousIntent: 'ambiguous_intent',
  missingFinancialContext: 'missing_financial_context',
  unsupportedTopic: 'unsupported_topic',
})

export function createClarificationState({
  missingFields = [],
  reason = null,
  required = false,
} = {}) {
  const isRequired = Boolean(required)

  if (!isRequired) {
    if (reason !== null) {
      throw new Error(
        'ClarificationState cannot have a reason when required is false.',
      )
    }
    if (Array.isArray(missingFields) && missingFields.length > 0) {
      throw new Error(
        'ClarificationState cannot have missingFields when required is false.',
      )
    }
    return Object.freeze({
      missingFields: Object.freeze([]),
      reason: null,
      required: false,
    })
  }

  if (!reason || !Object.values(CLARIFICATION_REASONS).includes(reason)) {
    throw new Error(
      `Invalid clarification reason "${reason}". Allowed: ${Object.values(CLARIFICATION_REASONS).join(', ')}.`,
    )
  }

  if (!Array.isArray(missingFields)) {
    throw new Error('ClarificationState missingFields must be an array.')
  }

  for (const field of missingFields) {
    if (typeof field !== 'string' || field.trim().length === 0) {
      throw new Error('ClarificationState missingFields must contain non-empty strings.')
    }
  }

  return Object.freeze({
    missingFields: Object.freeze([...missingFields]),
    reason,
    required: true,
  })
}

export function requestClarificationState({ missingFields = [], reason } = {}) {
  return createClarificationState({
    missingFields,
    reason,
    required: true,
  })
}

export function resolveClarificationState() {
  return createClarificationState({
    missingFields: [],
    reason: null,
    required: false,
  })
}
