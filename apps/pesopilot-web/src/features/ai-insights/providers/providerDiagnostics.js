import { ProviderError, PROVIDER_ERROR_CODES } from './providerErrors.js'

export const PROVIDER_DIAGNOSTICS_VERSION = '1.0.0'

export function createProviderDiagnostics({
  providerId = 'ollama',
  model = '',
  totalDurationNs = null,
  loadDurationNs = null,
  promptEvalCount = null,
  evalCount = null,
} = {}) {
  if (typeof providerId !== 'string' || !providerId.trim()) {
    throw new ProviderError({
      code: PROVIDER_ERROR_CODES.INVALID_REQUEST,
      message: 'Provider diagnostics providerId must be a non-empty string.',
    })
  }

  if (typeof model !== 'string' || !model.trim()) {
    throw new ProviderError({
      code: PROVIDER_ERROR_CODES.INVALID_REQUEST,
      message: 'Provider diagnostics model must be a non-empty string.',
      providerId,
    })
  }

  return Object.freeze({
    version: PROVIDER_DIAGNOSTICS_VERSION,
    providerId: providerId.trim(),
    model: model.trim(),
    totalDurationNs:
      totalDurationNs !== null && totalDurationNs !== undefined
        ? Number(totalDurationNs)
        : null,
    loadDurationNs:
      loadDurationNs !== null && loadDurationNs !== undefined
        ? Number(loadDurationNs)
        : null,
    promptEvalCount:
      promptEvalCount !== null && promptEvalCount !== undefined
        ? Number(promptEvalCount)
        : null,
    evalCount:
      evalCount !== null && evalCount !== undefined ? Number(evalCount) : null,
  })
}

export function validateProviderDiagnostics(diagnostics) {
  const errors = []

  if (!diagnostics || typeof diagnostics !== 'object') {
    return {
      valid: false,
      errors: ['ProviderDiagnostics must be a valid object.'],
    }
  }

  if (diagnostics.version !== PROVIDER_DIAGNOSTICS_VERSION) {
    errors.push(
      `ProviderDiagnostics version must be "${PROVIDER_DIAGNOSTICS_VERSION}".`,
    )
  }

  if (typeof diagnostics.providerId !== 'string' || !diagnostics.providerId.trim()) {
    errors.push('ProviderDiagnostics providerId must be a non-empty string.')
  }

  if (typeof diagnostics.model !== 'string' || !diagnostics.model.trim()) {
    errors.push('ProviderDiagnostics model must be a non-empty string.')
  }

  const numericFields = [
    'totalDurationNs',
    'loadDurationNs',
    'promptEvalCount',
    'evalCount',
  ]

  numericFields.forEach((field) => {
    const val = diagnostics[field]
    if (val !== null && (typeof val !== 'number' || isNaN(val))) {
      errors.push(`ProviderDiagnostics ${field} must be a number or null.`)
    }
  })

  return {
    valid: errors.length === 0,
    errors,
  }
}
