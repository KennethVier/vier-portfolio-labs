import {
  createProviderResponse,
  validateProviderResponse,
} from '../providers/providerResponse.js'
import { createProviderDiagnostics } from '../providers/providerDiagnostics.js'
import { validateProviderRequest } from '../providers/providerRequest.js'
import { validateProviderStreamRequest } from '../providers/providerStreamRequest.js'
import {
  ProviderError,
  PROVIDER_ERROR_CODES,
} from '../providers/providerErrors.js'

function deepCloneAndFreeze(value) {
  if (value === null || typeof value !== 'object') {
    return value
  }
  if (value instanceof Error || (typeof AbortSignal !== 'undefined' && value instanceof AbortSignal)) {
    return value
  }
  if (Array.isArray(value)) {
    return Object.freeze(value.map(deepCloneAndFreeze))
  }
  const proto = Object.getPrototypeOf(value)
  if (proto !== null && proto !== Object.prototype) {
    return value
  }
  const copy = {}
  for (const [k, v] of Object.entries(value)) {
    copy[k] = deepCloneAndFreeze(v)
  }
  return Object.freeze(copy)
}

export function createMockProvider({
  id = 'ollama',
  locality = 'local',
  generateScript = [],
  streamScript = [],
  defaultResponseContent = 'Deterministic financial summary explanation.',
} = {}) {
  const generateQueue = Array.isArray(generateScript)
    ? [...generateScript]
    : [generateScript]
  const streamQueue = Array.isArray(streamScript)
    ? [...streamScript]
    : [streamScript]

  const callHistory = []

  function recordCall(type, request, config) {
    const attempt = callHistory.length + 1
    const callRecord = Object.freeze({
      type,
      attempt,
      request: deepCloneAndFreeze(request),
      config: Object.freeze({
        transportTimeoutMs: config?.transportTimeoutMs ?? null,
        signalAborted: Boolean(config?.signal?.aborted),
        hasSignal: Boolean(config?.signal),
      }),
      timestamp: Date.now(),
    })
    callHistory.push(callRecord)
    return callRecord
  }

  function resolveScriptedError(item, model) {
    if (item instanceof Error) {
      return item
    }
    if (item && item.error instanceof Error) {
      return item.error
    }
    const code = item?.errorCode || item?.code || PROVIDER_ERROR_CODES.PROVIDER_UNAVAILABLE
    const message = item?.message || 'Mock provider scripted error.'
    return new ProviderError({
      code,
      message,
      providerId: id,
      model,
      status: item?.status || null,
    })
  }

  const adapter = {
    id,
    locality,

    async generate(providerRequest, providerConfig = {}) {
      // 1. Validate request using production validator
      const validation = validateProviderRequest(providerRequest)
      if (!validation.valid) {
        throw new ProviderError({
          code: PROVIDER_ERROR_CODES.INVALID_REQUEST,
          message: `Invalid ProviderRequest: ${validation.errors.join(' ')}`,
          providerId: id,
          model: providerRequest?.model ?? null,
        })
      }

      // 2. AbortSignal Precedence Check
      if (providerConfig.signal && providerConfig.signal.aborted) {
        throw new ProviderError({
          code: PROVIDER_ERROR_CODES.TRANSPORT_TIMEOUT,
          message: 'Operation was aborted before generation.',
          providerId: id,
          model: providerRequest.model,
        })
      }

      // 3. Record call snapshot without mutating request
      recordCall('generate', providerRequest, providerConfig)

      // 4. Resolve next scripted outcome
      const scriptItem = generateQueue.length > 0 ? generateQueue.shift() : null

      if (typeof scriptItem === 'function') {
        return scriptItem(providerRequest, providerConfig)
      }

      if (scriptItem && (scriptItem.error || scriptItem.errorCode || scriptItem instanceof Error)) {
        throw resolveScriptedError(scriptItem, providerRequest.model)
      }

      let contentToReturn = defaultResponseContent
      let finishReason = 'stop'
      let explicitDiagnostics = null

      if (typeof scriptItem === 'string') {
        contentToReturn = scriptItem
      } else if (scriptItem && typeof scriptItem === 'object') {
        // If scriptItem is already a canonical ProviderResponse
        if (scriptItem.version && scriptItem.content) {
          const respValidation = validateProviderResponse(scriptItem)
          if (respValidation.valid) {
            return scriptItem
          }
        }
        contentToReturn = scriptItem.content || defaultResponseContent
        finishReason = scriptItem.finishReason || 'stop'
        explicitDiagnostics = scriptItem.diagnostics || null
      }

      const diagnostics = explicitDiagnostics
        ? createProviderDiagnostics(explicitDiagnostics)
        : createProviderDiagnostics({
            providerId: id,
            model: providerRequest.model,
            totalDurationNs: 5000000,
            loadDurationNs: 1000000,
            promptEvalCount: 120,
            evalCount: 80,
          })

      return createProviderResponse({
        providerId: id,
        model: providerRequest.model,
        content: contentToReturn,
        finishReason,
        diagnostics,
      })
    },

    async *stream(providerStreamRequest, providerConfig = {}) {
      // 1. Validate stream request using production validator
      const validation = validateProviderStreamRequest(providerStreamRequest)
      if (!validation.valid) {
        throw new ProviderError({
          code: PROVIDER_ERROR_CODES.INVALID_REQUEST,
          message: `Invalid ProviderStreamRequest: ${validation.errors.join(' ')}`,
          providerId: id,
          model: providerStreamRequest?.model ?? null,
        })
      }

      // 2. AbortSignal Precedence Check
      if (providerConfig.signal && providerConfig.signal.aborted) {
        throw new ProviderError({
          code: PROVIDER_ERROR_CODES.TRANSPORT_TIMEOUT,
          message: 'Operation was aborted before streaming.',
          providerId: id,
          model: providerStreamRequest.model,
        })
      }

      // 3. Record call snapshot without mutating request
      recordCall('stream', providerStreamRequest, providerConfig)

      // 4. Resolve next scripted stream scenario
      const scriptItem = streamQueue.length > 0 ? streamQueue.shift() : null

      if (typeof scriptItem === 'function') {
        yield* scriptItem(providerStreamRequest, providerConfig)
        return
      }

      if (scriptItem && (scriptItem instanceof Error || scriptItem.error instanceof Error)) {
        throw resolveScriptedError(scriptItem, providerStreamRequest.model)
      }

      let fragments = []
      let trailingError = null

      if (Array.isArray(scriptItem)) {
        fragments = scriptItem
      } else if (scriptItem && typeof scriptItem === 'object') {
        fragments = Array.isArray(scriptItem.fragments) ? scriptItem.fragments : []
        if (scriptItem.error || scriptItem.errorCode) {
          trailingError = resolveScriptedError(scriptItem, providerStreamRequest.model)
        }
      } else {
        // Fallback default: split defaultResponseContent into 2 fragments
        const half = Math.ceil(defaultResponseContent.length / 2)
        fragments = [
          { textFragment: defaultResponseContent.slice(0, half), done: false },
          { textFragment: defaultResponseContent.slice(half), done: true },
        ]
      }

      for (let i = 0; i < fragments.length; i++) {
        if (providerConfig.signal && providerConfig.signal.aborted) {
          const abortErr = new Error('Operation was aborted during streaming generation.')
          abortErr.name = 'AbortError'
          throw abortErr
        }

        const frag = fragments[i]
        const isLast = i === fragments.length - 1 && !trailingError
        const isDone = typeof frag?.done === 'boolean' ? frag.done : isLast
        const textFragment = typeof frag === 'string'
          ? frag
          : (typeof frag?.textFragment === 'string' ? frag.textFragment : (frag?.content || ''))

        yield Object.freeze({
          version: '1.0.0',
          providerId: id,
          model: providerStreamRequest.model,
          textFragment,
          done: isDone,
          rawDoneReason: frag?.rawDoneReason || (isDone ? 'stop' : null),
          totalDurationNs: frag?.totalDurationNs ?? (isDone ? 6000000 : null),
          loadDurationNs: frag?.loadDurationNs ?? (isDone ? 1000000 : null),
          promptEvalCount: frag?.promptEvalCount ?? (isDone ? 150 : null),
          evalCount: frag?.evalCount ?? (isDone ? 90 : null),
        })
      }

      if (trailingError) {
        throw trailingError
      }
    },

    getCalls() {
      return Object.freeze([...callHistory])
    },

    getCallCount() {
      return callHistory.length
    },

    getLastCall() {
      return callHistory.length > 0 ? callHistory[callHistory.length - 1] : null
    },

    clearCalls() {
      callHistory.length = 0
    },
  }

  return Object.freeze(adapter)
}
