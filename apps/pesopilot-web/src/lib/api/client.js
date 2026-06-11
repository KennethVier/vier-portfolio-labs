import axios from 'axios'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export function normalizeApiError(error) {
  if (error.response?.data?.message) {
    return new Error(error.response.data.message)
  }

  if (error.message) {
    return new Error(error.message)
  }

  return new Error('Unexpected API error')
}
