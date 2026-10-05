import { apiClient, normalizeApiError } from '../../../lib/api/client.js'

async function requestExplanation(context) {
  if (!context || typeof context !== 'object') {
    throw new Error('requestExplanation requires a valid context object.')
  }

  try {
    const response = await apiClient.post('/api/v1/ai/explanations', { context })
    return response?.data?.data
  } catch (error) {
    throw normalizeApiError(error)
  }
}

export const aiGateway = Object.freeze({
  name: 'ai-gateway',
  status: 'ready',
  requestExplanation,
})
