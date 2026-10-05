import { ProviderError, PROVIDER_ERROR_CODES } from '../providerErrors.js'
import { validateProviderRequest } from '../providerRequest.js'
import {
  DEFAULT_OLLAMA_BASE_URL,
  DEFAULT_OLLAMA_TIMEOUT_MS,
  defaultFetchTransport,
  validateLoopbackUrl,
} from './ollamaTransport.js'
import {
  mapFromOllamaGenerateResponse,
  mapToOllamaGeneratePayload,
} from './ollamaMapper.js'
import { validateProviderStreamRequest } from '../providerStreamRequest.js'
import { defaultOllamaStreamTransport } from './ollamaStreamTransport.js'

function isModelNotFoundError(status, data) {
  if (status !== 404) return false
  if (!data) return false
  const errorMsg = data.error || data.message
  if (typeof errorMsg === 'string' && errorMsg.toLowerCase().includes('not found')) {
    return true
  }
  return false
}

export function createOllamaAdapter({
  transport = defaultFetchTransport,
  streamTransport = defaultOllamaStreamTransport,
} = {}) {
  return Object.freeze({
    id: 'ollama',
    locality: 'local',

    async generate(providerRequest, providerConfig = {}) {
      const validation = validateProviderRequest(providerRequest)
      if (!validation.valid) {
        throw new ProviderError({
          code: PROVIDER_ERROR_CODES.INVALID_REQUEST,
          message: `Invalid ProviderRequest: ${validation.errors.join(' ')}`,
          providerId: 'ollama',
          model: providerRequest?.model ?? null,
        })
      }

      const baseUrl = validateLoopbackUrl(
        providerConfig.baseUrl || DEFAULT_OLLAMA_BASE_URL,
      )
      const timeoutMs =
        typeof providerConfig.transportTimeoutMs === 'number' &&
        providerConfig.transportTimeoutMs > 0
          ? providerConfig.transportTimeoutMs
          : DEFAULT_OLLAMA_TIMEOUT_MS

      const signal = providerConfig?.signal || undefined

      if (signal && signal.aborted) {
        throw new ProviderError({
          code: PROVIDER_ERROR_CODES.TRANSPORT_TIMEOUT,
          message: 'Operation was aborted before starting.',
          providerId: 'ollama',
          model: providerRequest?.model ?? null,
        })
      }

      // 1. Locality Preflight: POST /api/show { model }
      // CRITICAL: Preflight sends ONLY the model name. Zero prompt or financial text is transmitted.
      const showUrl = `${baseUrl}/api/show`
      let showResult
      try {
        showResult = await transport(showUrl, {
          method: 'POST',
          body: { model: providerRequest.model },
          timeoutMs,
          signal,
        })
      } catch (err) {
        if (err instanceof ProviderError) throw err
        throw new ProviderError({
          code: PROVIDER_ERROR_CODES.PROVIDER_UNAVAILABLE,
          message: 'Failed to reach Ollama daemon for locality preflight.',
          providerId: 'ollama',
          model: providerRequest.model,
        })
      }

      if (!showResult || typeof showResult.status !== 'number') {
        throw new ProviderError({
          code: PROVIDER_ERROR_CODES.UNKNOWN_LOCALITY_REJECTED,
          message: 'Ollama locality preflight returned an invalid transport result.',
          providerId: 'ollama',
          model: providerRequest.model,
        })
      }

      if (showResult.status !== 200) {
        if (isModelNotFoundError(showResult.status, showResult.data)) {
          throw new ProviderError({
            code: PROVIDER_ERROR_CODES.MODEL_NOT_FOUND,
            message: `Model "${providerRequest.model}" was not found in local Ollama.`,
            providerId: 'ollama',
            model: providerRequest.model,
            status: 404,
          })
        }
        throw new ProviderError({
          code: PROVIDER_ERROR_CODES.PROVIDER_REJECTED_REQUEST,
          message: `Ollama preflight rejected request with status ${showResult.status}.`,
          providerId: 'ollama',
          model: providerRequest.model,
          status: showResult.status,
        })
      }

      const showData = showResult.data
      if (!showData || typeof showData !== 'object' || Array.isArray(showData)) {
        throw new ProviderError({
          code: PROVIDER_ERROR_CODES.UNKNOWN_LOCALITY_REJECTED,
          message: 'Ollama locality preflight response is not a valid object.',
          providerId: 'ollama',
          model: providerRequest.model,
        })
      }

      // Check authoritative remote signals
      const remoteHost =
        typeof showData.remote_host === 'string'
          ? showData.remote_host.trim()
          : ''
      const remoteModel =
        typeof showData.remote_model === 'string'
          ? showData.remote_model.trim()
          : ''

      if (remoteHost.length > 0) {
        throw new ProviderError({
          code: PROVIDER_ERROR_CODES.REMOTE_MODEL_REJECTED,
          message: `Model "${providerRequest.model}" is hosted remotely on "${remoteHost}". Phase 11B.3 requires local execution.`,
          providerId: 'ollama',
          model: providerRequest.model,
        })
      }

      if (remoteModel.length > 0) {
        throw new ProviderError({
          code: PROVIDER_ERROR_CODES.REMOTE_MODEL_REJECTED,
          message: `Model "${providerRequest.model}" references remote model "${remoteModel}". Phase 11B.3 requires local execution.`,
          providerId: 'ollama',
          model: providerRequest.model,
        })
      }

      if (signal && signal.aborted) {
        throw new ProviderError({
          code: PROVIDER_ERROR_CODES.TRANSPORT_TIMEOUT,
          message: 'Operation was aborted before generation.',
          providerId: 'ollama',
          model: providerRequest.model,
        })
      }

      // 2. Generation Request: POST /api/generate
      // Transmit PromptPackage payload only after model locality is verified
      const generateUrl = `${baseUrl}/api/generate`
      const payload = mapToOllamaGeneratePayload(providerRequest)

      let genResult
      try {
        genResult = await transport(generateUrl, {
          method: 'POST',
          body: payload,
          timeoutMs,
          signal,
        })
      } catch (err) {
        if (err instanceof ProviderError) throw err
        throw new ProviderError({
          code: PROVIDER_ERROR_CODES.PROVIDER_UNAVAILABLE,
          message: 'Failed to communicate with Ollama during generation.',
          providerId: 'ollama',
          model: providerRequest.model,
        })
      }

      if (!genResult || typeof genResult.status !== 'number') {
        throw new ProviderError({
          code: PROVIDER_ERROR_CODES.INVALID_PROVIDER_RESPONSE,
          message: 'Ollama generation returned an invalid transport result.',
          providerId: 'ollama',
          model: providerRequest.model,
        })
      }

      if (genResult.status !== 200) {
        if (isModelNotFoundError(genResult.status, genResult.data)) {
          throw new ProviderError({
            code: PROVIDER_ERROR_CODES.MODEL_NOT_FOUND,
            message: `Model "${providerRequest.model}" was not found in Ollama during generation.`,
            providerId: 'ollama',
            model: providerRequest.model,
            status: 404,
          })
        }
        throw new ProviderError({
          code: PROVIDER_ERROR_CODES.PROVIDER_REJECTED_REQUEST,
          message: `Ollama generation rejected request with status ${genResult.status}.`,
          providerId: 'ollama',
          model: providerRequest.model,
          status: genResult.status,
        })
      }

      return mapFromOllamaGenerateResponse({
        rawData: genResult.data,
        providerId: 'ollama',
        model: providerRequest.model,
      })
    },

    async *stream(providerStreamRequest, providerConfig = {}) {
      const validation = validateProviderStreamRequest(providerStreamRequest)
      if (!validation.valid) {
        throw new ProviderError({
          code: PROVIDER_ERROR_CODES.INVALID_REQUEST,
          message: `Invalid ProviderStreamRequest: ${validation.errors.join(' ')}`,
          providerId: 'ollama',
          model: providerStreamRequest?.model ?? null,
        })
      }

      yield* streamTransport(providerStreamRequest, {
        transport,
        ...providerConfig,
      })
    },
  })
}

export const ollamaAdapter = createOllamaAdapter()
