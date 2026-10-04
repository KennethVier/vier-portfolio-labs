import { ProviderError, PROVIDER_ERROR_CODES } from './providerErrors.js'
import { ollamaAdapter } from './ollama/ollamaAdapter.js'
import { assertAdapterContract } from './llmAdapter.js'

export function createProviderRegistry(adapters = [ollamaAdapter]) {
  const adapterMap = new Map()

  adapters.forEach((adapter) => {
    assertAdapterContract(adapter)
    adapterMap.set(adapter.id, adapter)
  })

  return Object.freeze({
    getProviderAdapter(providerId) {
      if (typeof providerId !== 'string' || !adapterMap.has(providerId)) {
        throw new ProviderError({
          code: PROVIDER_ERROR_CODES.UNKNOWN_PROVIDER,
          message: `Unknown provider: "${providerId}".`,
          providerId: typeof providerId === 'string' ? providerId : null,
        })
      }
      return adapterMap.get(providerId)
    },

    getProviderDescriptor(providerId) {
      const adapter = this.getProviderAdapter(providerId)
      return Object.freeze({
        id: adapter.id,
        locality: adapter.locality,
        status: 'active',
      })
    },

    listProviderDescriptors() {
      return Object.freeze(
        Array.from(adapterMap.values()).map((adapter) =>
          Object.freeze({
            id: adapter.id,
            locality: adapter.locality,
            status: 'active',
          }),
        ),
      )
    },
  })
}

export const providerRegistry = createProviderRegistry()
