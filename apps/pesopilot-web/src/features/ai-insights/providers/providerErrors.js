export const PROVIDER_ERROR_CODES = Object.freeze({
  INVALID_REQUEST: 'INVALID_REQUEST',
  UNKNOWN_PROVIDER: 'UNKNOWN_PROVIDER',
  INVALID_PROVIDER_CONFIG: 'INVALID_PROVIDER_CONFIG',
  INSECURE_ENDPOINT_REJECTED: 'INSECURE_ENDPOINT_REJECTED',
  PROVIDER_UNAVAILABLE: 'PROVIDER_UNAVAILABLE',
  TRANSPORT_TIMEOUT: 'TRANSPORT_TIMEOUT',
  MODEL_NOT_FOUND: 'MODEL_NOT_FOUND',
  REMOTE_MODEL_REJECTED: 'REMOTE_MODEL_REJECTED',
  UNKNOWN_LOCALITY_REJECTED: 'UNKNOWN_LOCALITY_REJECTED',
  PROVIDER_REJECTED_REQUEST: 'PROVIDER_REJECTED_REQUEST',
  INVALID_PROVIDER_RESPONSE: 'INVALID_PROVIDER_RESPONSE',
  TRANSPORT_ERROR: 'TRANSPORT_ERROR',
})

export class ProviderError extends Error {
  constructor({
    code,
    message,
    providerId = 'ollama',
    model = null,
    status = null,
  }) {
    super(message)
    this.name = 'ProviderError'
    this.code = code
    this.providerId = providerId
    this.model = model
    this.status = status
    Object.freeze(this)
  }
}
