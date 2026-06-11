import { apiClient, normalizeApiError } from './client.js'

export async function getHealth() {
  try {
    const response = await apiClient.get('/health')
    return response.data
  } catch (error) {
    throw normalizeApiError(error)
  }
}
