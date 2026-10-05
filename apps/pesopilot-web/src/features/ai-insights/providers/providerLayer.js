import { providerRegistry } from './providerRegistry.js'
import {
  createProviderRequest,
  validateProviderRequest,
} from './providerRequest.js'
import {
  createProviderStreamRequest,
  validateProviderStreamRequest,
} from './providerStreamRequest.js'
import { validateProviderResponse } from './providerResponse.js'
import { validateProviderDiagnostics } from './providerDiagnostics.js'

export const providerLayer = Object.freeze({
  name: 'provider-layer',
  status: 'ready',

  getProvider: (providerId) => providerRegistry.getProviderAdapter(providerId),
  getProviderDescriptor: (providerId) =>
    providerRegistry.getProviderDescriptor(providerId),
  listProviders: () => providerRegistry.listProviderDescriptors(),
  supportsStreaming: (providerId) => {
    try {
      const adapter = providerRegistry.getProviderAdapter(providerId)
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
