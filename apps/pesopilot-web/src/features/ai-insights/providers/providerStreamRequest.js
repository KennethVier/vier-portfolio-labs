import { ProviderError, PROVIDER_ERROR_CODES } from './providerErrors.js'

export const PROVIDER_STREAM_REQUEST_VERSION = '1.0.0'

export function createProviderStreamRequest({
  promptPackage,
  model,
  providerId = 'ollama',
} = {}) {
  if (providerId !== 'ollama') {
    throw new ProviderError({
      code: PROVIDER_ERROR_CODES.INVALID_REQUEST,
      message: 'Phase 11B supports providerId "ollama" only.',
      providerId,
      model: typeof model === 'string' ? model.trim() : null,
    })
  }

  if (typeof model !== 'string' || !model.trim()) {
    throw new ProviderError({
      code: PROVIDER_ERROR_CODES.INVALID_REQUEST,
      message: 'Model identifier is required and must be a non-empty string.',
      providerId,
    })
  }

  if (
    !promptPackage ||
    typeof promptPackage !== 'object' ||
    typeof promptPackage.systemPrompt !== 'string' ||
    !promptPackage.systemPrompt.trim() ||
    typeof promptPackage.userPrompt !== 'string' ||
    !promptPackage.userPrompt.trim()
  ) {
    throw new ProviderError({
      code: PROVIDER_ERROR_CODES.INVALID_REQUEST,
      message:
        'Valid PromptPackage with non-empty systemPrompt and userPrompt is required.',
      providerId,
      model: model.trim(),
    })
  }

  return Object.freeze({
    version: PROVIDER_STREAM_REQUEST_VERSION,
    providerId: 'ollama',
    model: model.trim(),
    prompt: Object.freeze({
      system: promptPackage.systemPrompt,
      user: promptPackage.userPrompt,
    }),
  })
}

export function validateProviderStreamRequest(providerStreamRequest) {
  const errors = []

  if (!providerStreamRequest || typeof providerStreamRequest !== 'object') {
    return {
      valid: false,
      errors: ['ProviderStreamRequest must be a valid object.'],
    }
  }

  if (providerStreamRequest.version !== PROVIDER_STREAM_REQUEST_VERSION) {
    errors.push(
      `ProviderStreamRequest version must be "${PROVIDER_STREAM_REQUEST_VERSION}".`,
    )
  }

  if (providerStreamRequest.providerId !== 'ollama') {
    errors.push('ProviderStreamRequest providerId must be "ollama".')
  }

  if (
    typeof providerStreamRequest.model !== 'string' ||
    !providerStreamRequest.model.trim()
  ) {
    errors.push('ProviderStreamRequest model must be a non-empty string.')
  }

  if (
    !providerStreamRequest.prompt ||
    typeof providerStreamRequest.prompt !== 'object' ||
    typeof providerStreamRequest.prompt.system !== 'string' ||
    !providerStreamRequest.prompt.system.trim() ||
    typeof providerStreamRequest.prompt.user !== 'string' ||
    !providerStreamRequest.prompt.user.trim()
  ) {
    errors.push(
      'ProviderStreamRequest prompt must contain non-empty system and user strings.',
    )
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
