import { ProviderError, PROVIDER_ERROR_CODES } from './providerErrors.js'
import { validateProviderDiagnostics } from './providerDiagnostics.js'

export const PROVIDER_RESPONSE_VERSION = '1.0.0'

export function createProviderResponse({
  providerId = 'ollama',
  model = '',
  content = '',
  finishReason = null,
  diagnostics = {},
} = {}) {
  if (typeof providerId !== 'string' || !providerId.trim()) {
    throw new ProviderError({
      code: PROVIDER_ERROR_CODES.INVALID_PROVIDER_RESPONSE,
      message: 'ProviderResponse providerId must be a non-empty string.',
    })
  }

  if (typeof model !== 'string' || !model.trim()) {
    throw new ProviderError({
      code: PROVIDER_ERROR_CODES.INVALID_PROVIDER_RESPONSE,
      message: 'ProviderResponse model must be a non-empty string.',
      providerId,
    })
  }

  if (typeof content !== 'string' || !content.trim()) {
    throw new ProviderError({
      code: PROVIDER_ERROR_CODES.INVALID_PROVIDER_RESPONSE,
      message: 'ProviderResponse content must be a non-empty string.',
      providerId,
      model,
    })
  }

  if (!diagnostics || typeof diagnostics !== 'object') {
    throw new ProviderError({
      code: PROVIDER_ERROR_CODES.INVALID_PROVIDER_RESPONSE,
      message: 'ProviderResponse diagnostics must be a valid object.',
      providerId,
      model,
    })
  }

  return Object.freeze({
    version: PROVIDER_RESPONSE_VERSION,
    providerId: providerId.trim(),
    model: model.trim(),
    content,
    finishReason:
      typeof finishReason === 'string' && finishReason.trim()
        ? finishReason.trim()
        : null,
    diagnostics: Object.freeze({ ...diagnostics }),
  })
}

export function validateProviderResponse(providerResponse) {
  const errors = []

  if (!providerResponse || typeof providerResponse !== 'object') {
    return {
      valid: false,
      errors: ['ProviderResponse must be a valid object.'],
    }
  }

  if (providerResponse.version !== PROVIDER_RESPONSE_VERSION) {
    errors.push(
      `ProviderResponse version must be "${PROVIDER_RESPONSE_VERSION}".`,
    )
  }

  if (
    typeof providerResponse.providerId !== 'string' ||
    !providerResponse.providerId.trim()
  ) {
    errors.push('ProviderResponse providerId must be a non-empty string.')
  }

  if (
    typeof providerResponse.model !== 'string' ||
    !providerResponse.model.trim()
  ) {
    errors.push('ProviderResponse model must be a non-empty string.')
  }

  if (
    typeof providerResponse.content !== 'string' ||
    !providerResponse.content.trim()
  ) {
    errors.push('ProviderResponse content must be a non-empty string.')
  }

  if (
    providerResponse.finishReason !== null &&
    typeof providerResponse.finishReason !== 'string'
  ) {
    errors.push('ProviderResponse finishReason must be a string or null.')
  }

  const diagResult = validateProviderDiagnostics(providerResponse.diagnostics)
  if (!diagResult.valid) {
    errors.push(...diagResult.errors.map((e) => `Diagnostics error: ${e}`))
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
