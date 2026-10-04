import { ProviderError, PROVIDER_ERROR_CODES } from '../providerErrors.js'

export const DEFAULT_OLLAMA_BASE_URL = 'http://127.0.0.1:11434'
export const DEFAULT_OLLAMA_TIMEOUT_MS = 30000

const ALLOWED_LOOPBACK_HOSTNAMES = new Set([
  '127.0.0.1',
  'localhost',
  '::1',
  '[::1]',
])

export function validateLoopbackUrl(urlStr) {
  if (typeof urlStr !== 'string' || !urlStr.trim()) {
    throw new ProviderError({
      code: PROVIDER_ERROR_CODES.INVALID_PROVIDER_CONFIG,
      message: 'Base URL must be a non-empty string.',
    })
  }

  let parsed
  try {
    parsed = new URL(urlStr.trim())
  } catch {
    throw new ProviderError({
      code: PROVIDER_ERROR_CODES.INVALID_PROVIDER_CONFIG,
      message: `Invalid base URL: "${urlStr}".`,
    })
  }

  if (parsed.protocol !== 'http:') {
    throw new ProviderError({
      code: PROVIDER_ERROR_CODES.INSECURE_ENDPOINT_REJECTED,
      message: `Protocol must be "http:". Received "${parsed.protocol}".`,
    })
  }

  if (!ALLOWED_LOOPBACK_HOSTNAMES.has(parsed.hostname)) {
    throw new ProviderError({
      code: PROVIDER_ERROR_CODES.INSECURE_ENDPOINT_REJECTED,
      message: `Non-loopback hostname rejected: "${parsed.hostname}". Local Ollama requires loopback.`,
    })
  }

  if (parsed.username || parsed.password) {
    throw new ProviderError({
      code: PROVIDER_ERROR_CODES.INSECURE_ENDPOINT_REJECTED,
      message: 'Embedded credentials in base URL are strictly forbidden.',
    })
  }

  if (parsed.search) {
    throw new ProviderError({
      code: PROVIDER_ERROR_CODES.INSECURE_ENDPOINT_REJECTED,
      message: 'Query strings in base URL are strictly forbidden.',
    })
  }

  if (parsed.hash) {
    throw new ProviderError({
      code: PROVIDER_ERROR_CODES.INSECURE_ENDPOINT_REJECTED,
      message: 'Fragments in base URL are strictly forbidden.',
    })
  }

  if (parsed.pathname && parsed.pathname !== '/') {
    throw new ProviderError({
      code: PROVIDER_ERROR_CODES.INSECURE_ENDPOINT_REJECTED,
      message: `Unexpected path component "${parsed.pathname}" in base URL.`,
    })
  }

  return `${parsed.protocol}//${parsed.host}`
}

export async function defaultFetchTransport(url, options = {}) {
  const {
    method = 'POST',
    body,
    headers = {},
    timeoutMs = DEFAULT_OLLAMA_TIMEOUT_MS,
    fetchFn = globalThis.fetch,
    signal: externalSignal = null,
  } = options

  if (typeof fetchFn !== 'function') {
    throw new ProviderError({
      code: PROVIDER_ERROR_CODES.TRANSPORT_ERROR,
      message: 'No global or injected fetch function is available.',
    })
  }

  if (externalSignal && externalSignal.aborted) {
    throw new ProviderError({
      code: PROVIDER_ERROR_CODES.TRANSPORT_TIMEOUT,
      message: `Transport request timed out after ${timeoutMs}ms.`,
    })
  }

  let timeoutId = null
  let cleanupListeners = null
  let effectiveSignal = null

  let transportTimeoutSignal = null
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    transportTimeoutSignal = AbortSignal.timeout(timeoutMs)
  } else if (typeof AbortController !== 'undefined') {
    const controller = new AbortController()
    transportTimeoutSignal = controller.signal
    timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  }

  if (externalSignal && typeof AbortSignal !== 'undefined' && typeof AbortSignal.any === 'function') {
    effectiveSignal = transportTimeoutSignal
      ? AbortSignal.any([externalSignal, transportTimeoutSignal])
      : externalSignal
  } else if (externalSignal) {
    const compositeController = new AbortController()
    const onAbort = () => compositeController.abort()
    externalSignal.addEventListener('abort', onAbort, { once: true })
    if (transportTimeoutSignal) {
      transportTimeoutSignal.addEventListener('abort', onAbort, { once: true })
    }
    effectiveSignal = compositeController.signal
    cleanupListeners = () => {
      externalSignal.removeEventListener('abort', onAbort)
      if (transportTimeoutSignal) {
        transportTimeoutSignal.removeEventListener('abort', onAbort)
      }
    }
  } else {
    effectiveSignal = transportTimeoutSignal
  }

  try {
    const response = await fetchFn(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      redirect: 'error',
      signal: effectiveSignal,
    })

    let data = null
    const text = await response.text()
    if (text) {
      try {
        data = JSON.parse(text)
      } catch {
        data = { rawText: text }
      }
    }

    return {
      status: response.status,
      ok: response.ok,
      data,
    }
  } catch (err) {
    if (err instanceof ProviderError) {
      throw err
    }

    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      throw new ProviderError({
        code: PROVIDER_ERROR_CODES.TRANSPORT_TIMEOUT,
        message: `Transport request timed out after ${timeoutMs}ms.`,
      })
    }

    throw new ProviderError({
      code: PROVIDER_ERROR_CODES.PROVIDER_UNAVAILABLE,
      message: 'Ollama provider is unavailable or connection was refused.',
    })
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    if (cleanupListeners) {
      cleanupListeners()
    }
  }
}
