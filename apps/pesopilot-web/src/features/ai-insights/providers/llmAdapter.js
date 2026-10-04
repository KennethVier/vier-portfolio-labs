import { ProviderError, PROVIDER_ERROR_CODES } from './providerErrors.js'

export function assertAdapterContract(adapter) {
  if (!adapter || typeof adapter !== 'object') {
    throw new ProviderError({
      code: PROVIDER_ERROR_CODES.INVALID_REQUEST,
      message: 'Adapter must be a valid object.',
    })
  }

  if (typeof adapter.id !== 'string' || !adapter.id.trim()) {
    throw new ProviderError({
      code: PROVIDER_ERROR_CODES.INVALID_REQUEST,
      message: 'Adapter must have a non-empty string id.',
    })
  }

  if (adapter.locality !== 'local' && adapter.locality !== 'cloud') {
    throw new ProviderError({
      code: PROVIDER_ERROR_CODES.INVALID_REQUEST,
      message: 'Adapter locality must be "local" or "cloud".',
    })
  }

  if (typeof adapter.generate !== 'function') {
    throw new ProviderError({
      code: PROVIDER_ERROR_CODES.INVALID_REQUEST,
      message: 'Adapter must implement a generate function.',
    })
  }
}
