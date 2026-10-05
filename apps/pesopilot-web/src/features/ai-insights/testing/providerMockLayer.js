import { createProviderRegistry } from '../providers/providerRegistry.js'
import {
  createProviderRequest,
  validateProviderRequest,
} from '../providers/providerRequest.js'
import {
  createProviderStreamRequest,
  validateProviderStreamRequest,
} from '../providers/providerStreamRequest.js'
import { validateProviderResponse } from '../providers/providerResponse.js'
import { validateProviderDiagnostics } from '../providers/providerDiagnostics.js'

export function createMockProviderLayer(mockAdapter) {
  const adapters = Array.isArray(mockAdapter) ? mockAdapter : [mockAdapter]
  const registry = createProviderRegistry(adapters)

  return Object.freeze({
    name: 'provider-layer',
    status: 'ready',

    getProvider: (providerId) => registry.getProviderAdapter(providerId),
    getProviderDescriptor: (providerId) => registry.getProviderDescriptor(providerId),
    listProviders: () => registry.listProviderDescriptors(),
    supportsStreaming: (providerId) => {
      try {
        const adapter = registry.getProviderAdapter(providerId)
        return typeof adapter?.stream === 'function'
      } catch {
        return false
      }
    },

    createProviderRequest,
    createProviderStreamRequest,

    validateProviderRequest,
    validateProviderStreamRequest,
    validateProviderResponse,
    validateProviderDiagnostics,
  })
}
