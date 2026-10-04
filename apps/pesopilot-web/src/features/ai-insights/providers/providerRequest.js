import { ProviderError, PROVIDER_ERROR_CODES } from './providerErrors.js'

export const PROVIDER_REQUEST_VERSION = '1.0.0'

export function createProviderRequest({
  promptPackage,
  model,
  providerId = 'ollama',
} = {}) {
  if (providerId !== 'ollama') {
    throw new ProviderError({
      code: PROVIDER_ERROR_CODES.INVALID_REQUEST,
      message: 'Phase 11B.3 supports providerId "ollama" only.',
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
    version: PROVIDER_REQUEST_VERSION,
    providerId: 'ollama',
    model: model.trim(),
    prompt: Object.freeze({
      system: promptPackage.systemPrompt,
      user: promptPackage.userPrompt,
    }),
    generation: Object.freeze({
      stream: false,
    }),
  })
}

export function validateProviderRequest(providerRequest) {
  const errors = []

  if (!providerRequest || typeof providerRequest !== 'object') {
    return {
      valid: false,
      errors: ['ProviderRequest must be a valid object.'],
    }
  }

  if (providerRequest.version !== PROVIDER_REQUEST_VERSION) {
    errors.push(
      `ProviderRequest version must be "${PROVIDER_REQUEST_VERSION}".`,
    )
  }

  if (providerRequest.providerId !== 'ollama') {
    errors.push('ProviderRequest providerId must be "ollama".')
  }

  if (
    typeof providerRequest.model !== 'string' ||
    !providerRequest.model.trim()
  ) {
    errors.push('ProviderRequest model must be a non-empty string.')
  }

  if (
    !providerRequest.prompt ||
    typeof providerRequest.prompt !== 'object' ||
    typeof providerRequest.prompt.system !== 'string' ||
    !providerRequest.prompt.system.trim() ||
    typeof providerRequest.prompt.user !== 'string' ||
    !providerRequest.prompt.user.trim()
  ) {
    errors.push(
      'ProviderRequest prompt must contain non-empty system and user strings.',
    )
  }

  if (
    !providerRequest.generation ||
    typeof providerRequest.generation !== 'object' ||
    providerRequest.generation.stream !== false
  ) {
    errors.push('ProviderRequest generation.stream must be strictly false.')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
