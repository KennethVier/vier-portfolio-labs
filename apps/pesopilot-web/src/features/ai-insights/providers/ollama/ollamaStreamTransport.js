import { ProviderError, PROVIDER_ERROR_CODES } from '../providerErrors.js'
import {
  DEFAULT_OLLAMA_BASE_URL,
  DEFAULT_OLLAMA_TIMEOUT_MS,
  defaultFetchTransport,
  validateLoopbackUrl,
} from './ollamaTransport.js'

function isModelNotFoundError(status, data) {
  if (status !== 404) return false
  if (!data) return false
  const errorMsg = data.error || data.message
  if (typeof errorMsg === 'string' && errorMsg.toLowerCase().includes('not found')) {
    return true
  }
  return false
}

export async function* parseNdjsonStream(readableStream, { providerId = 'ollama', model = '', signal = null } = {}) {
  if (!readableStream || typeof readableStream.getReader !== 'function') {
    throw new ProviderError({
      code: PROVIDER_ERROR_CODES.INVALID_PROVIDER_RESPONSE,
      message: 'Ollama streaming response body is not a ReadableStream.',
      providerId,
      model,
    })
  }

  const reader = readableStream.getReader()
  const decoder = new TextDecoder('utf-8')
  let lineBuffer = ''

  try {
    while (true) {
      if (signal && signal.aborted) {
        await reader.cancel()
        const err = new Error('Operation was aborted during streaming generation.')
        err.name = 'AbortError'
        throw err
      }

      const { done, value } = await reader.read()
      if (done) break

      lineBuffer += decoder.decode(value, { stream: true })
      const lines = lineBuffer.split('\n')
      lineBuffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) continue

        let data
        try {
          data = JSON.parse(trimmed)
        } catch {
          throw new ProviderError({
            code: PROVIDER_ERROR_CODES.INVALID_PROVIDER_RESPONSE,
            message: 'Ollama stream emitted invalid JSON.',
            providerId,
            model,
          })
        }

        if (data.error) {
          throw new ProviderError({
            code: PROVIDER_ERROR_CODES.PROVIDER_REJECTED_REQUEST,
            message: data.error,
            providerId,
            model,
          })
        }

        yield Object.freeze({
          version: '1.0.0',
          providerId,
          model,
          textFragment: typeof data.response === 'string' ? data.response : '',
          done: Boolean(data.done),
          rawDoneReason: data.done_reason || null,
          totalDurationNs: data.total_duration ?? null,
          loadDurationNs: data.load_duration ?? null,
          promptEvalCount: data.prompt_eval_count ?? null,
          evalCount: data.eval_count ?? null,
        })
      }
    }

    lineBuffer += decoder.decode(undefined, { stream: false })
    if (lineBuffer.trim()) {
      let data
      try {
        data = JSON.parse(lineBuffer.trim())
      } catch {
        throw new ProviderError({
          code: PROVIDER_ERROR_CODES.INVALID_PROVIDER_RESPONSE,
          message: 'Ollama stream emitted invalid JSON.',
          providerId,
          model,
        })
      }

      if (data.error) {
        throw new ProviderError({
          code: PROVIDER_ERROR_CODES.PROVIDER_REJECTED_REQUEST,
          message: data.error,
          providerId,
          model,
        })
      }

      yield Object.freeze({
        version: '1.0.0',
        providerId,
        model,
        textFragment: typeof data.response === 'string' ? data.response : '',
        done: Boolean(data.done),
        rawDoneReason: data.done_reason || null,
        totalDurationNs: data.total_duration ?? null,
        loadDurationNs: data.load_duration ?? null,
        promptEvalCount: data.prompt_eval_count ?? null,
        evalCount: data.eval_count ?? null,
      })
    }
  } finally {
    reader.releaseLock()
  }
}

export async function* defaultOllamaStreamTransport(providerStreamRequest, providerConfig = {}) {
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
      model: providerStreamRequest?.model ?? null,
    })
  }

  const preflightTransport = providerConfig?.transport || defaultFetchTransport

  // 1. Locality Preflight: POST /api/show { model }
  // CRITICAL: Preflight sends ONLY the model name. Zero prompt or financial text is transmitted.
  const showUrl = `${baseUrl}/api/show`
  let showResult
  try {
    showResult = await preflightTransport(showUrl, {
      method: 'POST',
      body: { model: providerStreamRequest.model },
      timeoutMs,
      signal,
    })
  } catch (err) {
    if (err instanceof ProviderError) throw err
    throw new ProviderError({
      code: PROVIDER_ERROR_CODES.PROVIDER_UNAVAILABLE,
      message: 'Failed to reach Ollama daemon for locality preflight.',
      providerId: 'ollama',
      model: providerStreamRequest.model,
    })
  }

  if (!showResult || typeof showResult.status !== 'number') {
    throw new ProviderError({
      code: PROVIDER_ERROR_CODES.UNKNOWN_LOCALITY_REJECTED,
      message: 'Ollama locality preflight returned an invalid transport result.',
      providerId: 'ollama',
      model: providerStreamRequest.model,
    })
  }

  if (showResult.status !== 200) {
    if (isModelNotFoundError(showResult.status, showResult.data)) {
      throw new ProviderError({
        code: PROVIDER_ERROR_CODES.MODEL_NOT_FOUND,
        message: `Model "${providerStreamRequest.model}" was not found in local Ollama.`,
        providerId: 'ollama',
        model: providerStreamRequest.model,
        status: 404,
      })
    }
    throw new ProviderError({
      code: PROVIDER_ERROR_CODES.PROVIDER_REJECTED_REQUEST,
      message: `Ollama preflight rejected request with status ${showResult.status}.`,
      providerId: 'ollama',
      model: providerStreamRequest.model,
      status: showResult.status,
    })
  }

  const showData = showResult.data
  if (!showData || typeof showData !== 'object' || Array.isArray(showData)) {
    throw new ProviderError({
      code: PROVIDER_ERROR_CODES.UNKNOWN_LOCALITY_REJECTED,
      message: 'Ollama locality preflight response is not a valid object.',
      providerId: 'ollama',
      model: providerStreamRequest.model,
    })
  }

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
      message: `Model "${providerStreamRequest.model}" is hosted remotely on "${remoteHost}". Phase 11B requires local execution.`,
      providerId: 'ollama',
      model: providerStreamRequest.model,
    })
  }

  if (remoteModel.length > 0) {
    throw new ProviderError({
      code: PROVIDER_ERROR_CODES.REMOTE_MODEL_REJECTED,
      message: `Model "${providerStreamRequest.model}" references remote model "${remoteModel}". Phase 11B requires local execution.`,
      providerId: 'ollama',
      model: providerStreamRequest.model,
    })
  }

  if (signal && signal.aborted) {
    throw new ProviderError({
      code: PROVIDER_ERROR_CODES.TRANSPORT_TIMEOUT,
      message: 'Operation was aborted before generation.',
      providerId: 'ollama',
      model: providerStreamRequest.model,
    })
  }

  // 2. Generation Request: POST /api/generate with stream: true
  // Transmit PromptPackage payload only after model locality is verified
  const generateUrl = `${baseUrl}/api/generate`
  const payload = {
    model: providerStreamRequest.model,
    system: providerStreamRequest.prompt.system,
    prompt: providerStreamRequest.prompt.user,
    stream: true,
  }

  const fetchFn = providerConfig?.fetchFn || globalThis.fetch
  if (typeof fetchFn !== 'function') {
    throw new ProviderError({
      code: PROVIDER_ERROR_CODES.TRANSPORT_ERROR,
      message: 'No global or injected fetch function is available.',
    })
  }

  let response
  try {
    response = await fetchFn(generateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      redirect: 'error',
      signal,
    })
  } catch (err) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      throw new ProviderError({
        code: PROVIDER_ERROR_CODES.TRANSPORT_TIMEOUT,
        message: `Transport request timed out after ${timeoutMs}ms.`,
      })
    }
    throw new ProviderError({
      code: PROVIDER_ERROR_CODES.PROVIDER_UNAVAILABLE,
      message: 'Failed to communicate with Ollama during streaming generation.',
      providerId: 'ollama',
      model: providerStreamRequest.model,
    })
  }

  if (!response || response.status !== 200) {
    const status = response ? response.status : 500
    throw new ProviderError({
      code: PROVIDER_ERROR_CODES.PROVIDER_REJECTED_REQUEST,
      message: `Ollama streaming generation rejected request with status ${status}.`,
      providerId: 'ollama',
      model: providerStreamRequest.model,
      status,
    })
  }

  try {
    for await (const fragment of parseNdjsonStream(response.body, {
      providerId: 'ollama',
      model: providerStreamRequest.model,
      signal,
    })) {
      yield fragment
    }
  } catch (err) {
    if (err instanceof ProviderError) throw err
    if (err.name === 'AbortError') {
      throw new ProviderError({
        code: PROVIDER_ERROR_CODES.TRANSPORT_TIMEOUT,
        message: 'Operation was aborted during streaming generation.',
        providerId: 'ollama',
        model: providerStreamRequest.model,
      })
    }
    throw new ProviderError({
      code: PROVIDER_ERROR_CODES.INVALID_PROVIDER_RESPONSE,
      message: err.message || 'Ollama streaming generation failed.',
      providerId: 'ollama',
      model: providerStreamRequest.model,
    })
  }
}
