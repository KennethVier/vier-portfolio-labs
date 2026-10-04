export const MAX_WORKFLOW_ATTEMPTS = 2

const RETRYABLE_PROVIDER_ERROR_CODES = new Set([
  'PROVIDER_UNAVAILABLE',
  'TRANSPORT_TIMEOUT',
  'TRANSPORT_ERROR',
])

export function isRetryableProviderErrorCode(code) {
  if (typeof code !== 'string') return false
  return RETRYABLE_PROVIDER_ERROR_CODES.has(code.trim())
}

export function shouldRetry({
  attempt,
  error,
  isWorkflowAborted = false,
  remainingMs = 0,
} = {}) {
  // 1. Workflow Abort / Timeout Precedence: If master workflow signal is aborted, NEVER retry.
  if (isWorkflowAborted) {
    return false
  }

  // 2. Max Attempts Ceiling
  if (typeof attempt === 'number' && attempt >= MAX_WORKFLOW_ATTEMPTS) {
    return false
  }

  // 3. Deadline Check: If no remaining time, cannot retry.
  if (typeof remainingMs === 'number' && remainingMs <= 0) {
    return false
  }

  // 4. Retryable Error Classification
  if (!error || typeof error !== 'object') {
    return false
  }

  return isRetryableProviderErrorCode(error.code)
}

export const retryManager = Object.freeze({
  MAX_WORKFLOW_ATTEMPTS,
  isRetryableProviderErrorCode,
  shouldRetry,
})
