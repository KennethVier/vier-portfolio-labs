import { ProviderError, PROVIDER_ERROR_CODES } from '../providerErrors.js'
import { createProviderResponse } from '../providerResponse.js'
import { createProviderDiagnostics } from '../providerDiagnostics.js'

export function mapToOllamaGeneratePayload(providerRequest) {
  return {
    model: providerRequest.model,
    system: providerRequest.prompt.system,
    prompt: providerRequest.prompt.user,
    stream: false,
  }
}

export function mapFromOllamaGenerateResponse({
  rawData,
  providerId = 'ollama',
  model = '',
} = {}) {
  if (!rawData || typeof rawData !== 'object') {
    throw new ProviderError({
      code: PROVIDER_ERROR_CODES.INVALID_PROVIDER_RESPONSE,
      message: 'Ollama response is not a valid object.',
      providerId,
      model,
    })
  }

  if (rawData.done !== true) {
    throw new ProviderError({
      code: PROVIDER_ERROR_CODES.INVALID_PROVIDER_RESPONSE,
      message: 'Ollama generation response is incomplete or done !== true.',
      providerId,
      model,
    })
  }

  const content = rawData.response
  if (typeof content !== 'string' || !content.trim()) {
    throw new ProviderError({
      code: PROVIDER_ERROR_CODES.INVALID_PROVIDER_RESPONSE,
      message: 'Ollama generation response content must be a non-empty string.',
      providerId,
      model,
    })
  }

  const diagnostics = createProviderDiagnostics({
    providerId,
    model,
    totalDurationNs: rawData.total_duration ?? null,
    loadDurationNs: rawData.load_duration ?? null,
    promptEvalCount: rawData.prompt_eval_count ?? null,
    evalCount: rawData.eval_count ?? null,
  })

  const finishReason =
    typeof rawData.done_reason === 'string' && rawData.done_reason.trim()
      ? rawData.done_reason.trim()
      : null

  return createProviderResponse({
    providerId,
    model,
    content,
    finishReason,
    diagnostics,
  })
}
